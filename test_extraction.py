# -*- coding: utf-8 -*-
"""
Script de teste e validação de extração dos 9 PDFs da SEDUC
"""
import os
import re
import pdfplumber
import pandas as pd

PDF_DIR = r"c:\Users\J P\OneDrive\Desktop\Sistema Seduc\resultadospdf"

def clean_text(v):
    if v is None:
        return None
    s = str(v).replace('\r', ' ').replace('\n', ' ').strip()
    s = re.sub(r'\s+', ' ', s)
    return s if s else None

def parse_decimal(v):
    if v is None:
        return None
    s = clean_text(v)
    if not s or s == '-' or s == '--':
        return None
    # Remove any spaces around comma
    s = re.sub(r'\s*,\s*', '.', s)
    s = s.replace(' ', '')
    try:
        return float(s)
    except ValueError:
        return None

def parse_int(v):
    if v is None:
        return None
    s = clean_text(v)
    if not s or s == '-' or s == '--':
        return None
    # Remove thousands dots and spaces
    s = s.replace('.', '').replace(' ', '')
    try:
        return int(s)
    except ValueError:
        return None

def parse_bool(v):
    if v is None:
        return None
    s = clean_text(v)
    if not s:
        return None
    s_upper = s.upper()
    if 'SIM' in s_upper:
        return True
    if 'NÃO' in s_upper or 'NAO' in s_upper:
        return False
    return s

def test_extract_all():
    print("Testing extraction logic for all files...")
    # 1. EJA e AEE
    f1 = os.path.join(PDF_DIR, "ESCOLAS DE EDUCAÇAO DE JOVENS E ADULTOS E AEE - BONUS PARA PROFESSOR E ADMINISTRATIVO_ESCOLA_EXCLUSIVA.pdf")
    rows1 = []
    with pdfplumber.open(f1) as pdf:
        for p in pdf.pages:
            tables = p.extract_tables()
            for t in tables:
                for r in t:
                    # Header rows have None in first col or 'Nome do Município'
                    if r[1] and 'Munic' in str(r[1]):
                        continue
                    if r[7] and ('JOVENS' in str(r[7]) or 'EF_ANOS' in str(r[7])):
                        continue
                    # Data row check: r[4] is school code or r[0] is regional
                    code = clean_text(r[4])
                    if code and code.isdigit():
                        rows1.append({
                            'regional': clean_text(r[0]),
                            'municipio': clean_text(r[1]),
                            'localizacao': clean_text(r[2]),
                            'escola_indigena': parse_bool(r[3]),
                            'codigo_escola': code,
                            'tem_publicacao': parse_bool(r[5]),
                            'nome_escola': clean_text(r[6]),
                            'eja_fundamental_iniciais': parse_decimal(r[7]),
                            'eja_fundamental_finais': parse_decimal(r[8]),
                            'eja_medio': parse_decimal(r[9]),
                            'atendimento_especializado_aee': parse_decimal(r[10])
                        })
    print(f"1. EJA e AEE: {len(rows1)} registros extraídos.")
    if rows1:
        print("   Exemplo:", rows1[0])

    # 2. Não Publ - Regular Admin
    f2 = os.path.join(PDF_DIR, "ESCOLAS NÃO PUBLICADAS_ENSINO REGULAR _CARGO ADMINISTRATIVO.pdf")
    rows2 = []
    with pdfplumber.open(f2) as pdf:
        for p in pdf.pages:
            tables = p.extract_tables()
            for t in tables:
                for r in t:
                    if r[1] and 'Munic' in str(r[1]):
                        continue
                    code = clean_text(r[4])
                    if code and code.isdigit():
                        rows2.append({
                            'regional': clean_text(r[0]),
                            'municipio': clean_text(r[1]),
                            'localizacao': clean_text(r[2]),
                            'escola_indigena': parse_bool(r[3]),
                            'codigo_escola': code,
                            'nome_escola': clean_text(r[5]),
                            'indice_bonus_admin': parse_decimal(r[6])
                        })
    print(f"2. Não Publ Regular Admin: {len(rows2)} registros extraídos.")
    if rows2:
        print("   Exemplo:", rows2[0])

    # 3. Não Publ - Regular Prof
    f3 = os.path.join(PDF_DIR, "ESCOLAS NÃO PUBLICADAS_ENSINO REGULAR_BÔNUS PROFESSORES EM SALA DE AULA.pdf")
    rows3 = []
    with pdfplumber.open(f3) as pdf:
        for p_idx, p in enumerate(pdf.pages):
            txt = p.extract_text() or ''
            if 'ANOS INICIAIS' in txt.upper():
                etapa = 'ENSINO FUNDAMENTAL ANOS INICIAIS'
            elif 'ANOS FINAIS' in txt.upper():
                etapa = 'ENSINO FUNDAMENTAL ANOS FINAIS'
            elif 'MÉDIO' in txt.upper() or 'MEDIO' in txt.upper():
                etapa = 'ENSINO MEDIO'
            else:
                etapa = 'ENSINO FUNDAMENTAL'
            tables = p.extract_tables()
            for t in tables:
                for r in t:
                    if r[1] and 'Munic' in str(r[1]):
                        continue
                    if r[3] and 'Ind' in str(r[3]):
                        continue
                    code = clean_text(r[4])
                    if code and code.isdigit():
                        rows3.append({
                            'regional': clean_text(r[0]),
                            'municipio': clean_text(r[1]),
                            'localizacao': clean_text(r[2]),
                            'escola_indigena': parse_bool(r[3]),
                            'codigo_escola': code,
                            'nome_escola': clean_text(r[5]),
                            'ponto_bonus_professor': parse_decimal(r[6]),
                            'etapa_ensino': etapa
                        })
    print(f"3. Não Publ Regular Prof: {len(rows3)} registros extraídos.")
    if rows3:
        print("   Exemplo:", rows3[0])

    # 4. Não Publ - SECTET
    f4 = os.path.join(PDF_DIR, "ESCOLAS NÃO PUBLICADAS_SECTET - BÔNUS PROFESSOR E CARGO ADMINISTRATIVO.pdf")
    rows4 = []
    with pdfplumber.open(f4) as pdf:
        for p in pdf.pages:
            tables = p.extract_tables()
            for t in tables:
                for r in t:
                    if r[1] and 'Munic' in str(r[1]):
                        continue
                    code = clean_text(r[4])
                    if code and code.isdigit():
                        rows4.append({
                            'regional': clean_text(r[0]),
                            'municipio': clean_text(r[1]),
                            'localizacao': clean_text(r[2]),
                            'escola_indigena': parse_bool(r[3]),
                            'codigo_escola': code,
                            'nome_escola': clean_text(r[5]),
                            'indice_bonus_gestao': parse_decimal(r[6])
                        })
    print(f"4. Não Publ SECTET: {len(rows4)} registros extraídos.")
    if rows4:
        print("   Exemplo:", rows4[0])

    # 5. Publ Regular Admin
    f5 = os.path.join(PDF_DIR, "ESCOLAS PUBLICADAS - BÔNUS CARGOS ADMINISTRATIVOS.pdf")
    rows5 = []
    with pdfplumber.open(f5) as pdf:
        for p in pdf.pages:
            tables = p.extract_tables()
            for t in tables:
                for r in t:
                    if r[0] and ('Munic' in str(r[0]) or 'MATR' in str(r[0])):
                        continue
                    code = clean_text(r[2])
                    if code and code.isdigit():
                        rows5.append({
                            'municipio': clean_text(r[0]),
                            'localizacao': clean_text(r[1]),
                            'codigo_escola': code,
                            'nome_escola': clean_text(r[3]),
                            'matricula_ef_iniciais': parse_int(r[4]),
                            'matricula_ef_finais': parse_int(r[5]),
                            'matricula_em': parse_int(r[6]),
                            'matricula_total': parse_int(r[7]),
                            'pontos_ef_iniciais': parse_decimal(r[8]),
                            'pontos_ef_finais': parse_decimal(r[9]),
                            'pontos_em': parse_decimal(r[10]),
                            'ponderado_ef_iniciais': parse_decimal(r[11]),
                            'ponderado_ef_finais': parse_decimal(r[12]),
                            'ponderado_em': parse_decimal(r[13]),
                            'indice_bonus': parse_decimal(r[14])
                        })
    print(f"5. Publ Regular Admin: {len(rows5)} registros extraídos.")
    if rows5:
        print("   Exemplo:", rows5[0])

    # 6. Publ Regular Prof
    f6 = os.path.join(PDF_DIR, "ESCOLAS PUBLICADAS_BÔNUS PROFESSOR EM SALA DE AULA.pdf")
    rows6 = []
    with pdfplumber.open(f6) as pdf:
        for pno, p in enumerate(pdf.pages):
            txt = p.extract_text() or ''
            first_lines = txt.split('\n')[:3]
            txt_header = ' '.join(first_lines).upper()
            if 'ANOS INICIAIS' in txt_header:
                etapa = 'ENSINO FUNDAMENTAL ANOS INICIAIS'
            elif 'ANOS FINAIS' in txt_header:
                etapa = 'ENSINO FUNDAMENTAL ANOS FINAIS'
            elif 'MÉDIO' in txt_header or 'MEDIO' in txt_header:
                etapa = 'ENSINO MEDIO'
            else:
                etapa = 'ENSINO REGULAR'
            
            tables = p.extract_tables()
            for t in tables:
                for r in t:
                    # check if code is at col 2
                    code = clean_text(r[2]) if len(r) > 2 else None
                    if code and code.isdigit():
                        if etapa == 'ENSINO FUNDAMENTAL ANOS INICIAIS':
                            # 12 columns
                            rows6.append({
                                'municipio': clean_text(r[0]),
                                'regiao_integracao': clean_text(r[1]),
                                'codigo_escola': code,
                                'nome_escola': clean_text(r[3]),
                                'etapa_ensino': etapa,
                                'meta_pactuada': parse_decimal(r[4]),
                                'decimo_crescimento': parse_decimal(r[5]),
                                'ponto_crescimento': parse_decimal(r[6]),
                                'ponto_regiao_integracao': parse_decimal(r[7]),
                                'ponto_fluxo': parse_decimal(r[8]),
                                'ponto_alfabetizacao': parse_decimal(r[9]),
                                'bonus_prof_1_e_2_ano': parse_decimal(r[10]),
                                'bonus_prof_3_a_5_ano': parse_decimal(r[11]),
                                'indice_bonus': None
                            })
                        else:
                            # 10 columns
                            rows6.append({
                                'municipio': clean_text(r[0]),
                                'regiao_integracao': clean_text(r[1]),
                                'codigo_escola': code,
                                'nome_escola': clean_text(r[3]),
                                'etapa_ensino': etapa,
                                'meta_pactuada': parse_decimal(r[4]),
                                'decimo_crescimento': parse_decimal(r[5]),
                                'ponto_crescimento': parse_decimal(r[6]),
                                'ponto_regiao_integracao': parse_decimal(r[7]),
                                'ponto_fluxo': parse_decimal(r[8]),
                                'ponto_alfabetizacao': None,
                                'bonus_prof_1_e_2_ano': None,
                                'bonus_prof_3_a_5_ano': None,
                                'indice_bonus': parse_decimal(r[9]) if len(r) > 9 else None
                            })
    print(f"6. Publ Regular Prof: {len(rows6)} registros extraídos.")
    if rows6:
        print("   Exemplo:", rows6[0])

    # 7. Publ SECTET
    f7 = os.path.join(PDF_DIR, "ESCOLAS PUBLICADAS_SECTET_BÔNUS PROFESSOR EM SALA DE AULA E CARGO ADMINISTRATIVO.pdf")
    rows7 = []
    with pdfplumber.open(f7) as pdf:
        for p in pdf.pages:
            tables = p.extract_tables()
            for t in tables:
                for r in t:
                    code = clean_text(r[1]) if len(r) > 1 else None
                    if code and code.isdigit():
                        rows7.append({
                            'municipio': clean_text(r[0]),
                            'codigo_escola': code,
                            'sectet': parse_bool(r[2]),
                            'nome_escola': clean_text(r[3]),
                            'atingiu_meta_pactuada': parse_decimal(r[4]),
                            'decimo_crescimento': parse_decimal(r[5]),
                            'ponto_crescimento': parse_decimal(r[6]),
                            'fluxo': parse_decimal(r[7]),
                            'bonus_prof_vinculado_turma': parse_decimal(r[8]),
                            'bonus_cargo_administrativo': parse_decimal(r[9])
                        })
    print(f"7. Publ SECTET: {len(rows7)} registros extraídos.")
    if rows7:
        print("   Exemplo:", rows7[0])

    # 8. Pontos Bônus DRE
    f8 = os.path.join(PDF_DIR, "PONTOS DE BONOS_DRE.pdf")
    rows8 = []
    with pdfplumber.open(f8) as pdf:
        for p in pdf.pages:
            tables = p.extract_tables()
            for t in tables:
                for r in t:
                    dre = clean_text(r[1]) if len(r) > 1 else None
                    if not dre or dre in ['DRE', '', 'None']:
                        continue
                    # Check if this is a data row
                    rows8.append({
                        'ordem': parse_int(r[0]),
                        'dre': dre,
                        'pontos_ai': parse_decimal(r[2]),
                        'pontos_af': parse_decimal(r[3]),
                        'pontos_em': parse_decimal(r[4]),
                        'matricula_ai': parse_int(r[5]),
                        'matricula_af': parse_int(r[6]),
                        'matricula_em': parse_int(r[7]),
                        'matricula_total': parse_int(r[8]),
                        'bonus_ai': parse_decimal(r[9]),
                        'bonus_af': parse_decimal(r[10]),
                        'bonus_em': parse_decimal(r[11]),
                        'bonus_ri': parse_decimal(r[12]),
                        'bonus_total': parse_decimal(r[13])
                    })
    print(f"8. Pontos Bônus DRE: {len(rows8)} registros extraídos.")
    if rows8:
        print("   Exemplo:", rows8[0])

    # 9. IDEB DRE
    f9 = os.path.join(PDF_DIR, "Índice de Desenvolvimento da Educação Básica_DRE.pdf")
    rows9 = []
    with pdfplumber.open(f9) as pdf:
        for pno, p in enumerate(pdf.pages):
            txt = p.extract_text() or ''
            if 'ANOS INICIAIS' in txt.upper():
                etapa = 'ENSINO FUNDAMENTAL ANOS INICIAIS'
            elif 'ANOS FINAIS' in txt.upper():
                etapa = 'ENSINO FUNDAMENTAL ANOS FINAIS'
            elif 'MÉDIO' in txt.upper() or 'MEDIO' in txt.upper():
                etapa = 'ENSINO MEDIO'
            else:
                etapa = 'GERAL'
            tables = p.extract_tables()
            for t in tables:
                for r in t:
                    dre = clean_text(r[1]) if len(r) > 1 else None
                    if not dre or dre in ['DRE', '', 'None']:
                        continue
                    rows9.append({
                        'ordem': parse_int(r[0]),
                        'dre': dre,
                        'etapa_ensino': etapa,
                        'desempenho_lingua_portuguesa': parse_decimal(r[2]),
                        'desempenho_matematica': parse_decimal(r[3]),
                        'nota_padronizada_lp': parse_decimal(r[4]),
                        'nota_padronizada_mat': parse_decimal(r[5]),
                        'nota_padronizada_media': parse_decimal(r[6]),
                        'fluxo_tempo_medio': parse_decimal(r[7]),
                        'ideb': parse_decimal(r[8])
                    })
    print(f"9. IDEB DRE: {len(rows9)} registros extraídos.")
    if rows9:
        print("   Exemplo:", rows9[0])

if __name__ == '__main__':
    test_extract_all()
