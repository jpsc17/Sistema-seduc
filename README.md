<div align="center">

# 🏛️ SEDUC-PA · Sistema de Resultados e Bonificação Escolar

**Plataforma de Consolidação de Indicadores, Avaliação e Premiação da Rede Estadual de Ensino**

Ambiente integrado para extração, validação, cálculo estatístico de desempate e visualização analítica das escolas públicas do Estado do Pará.

[![Deploy](https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge&logo=vercel)](https://sistema-seduc-psi.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-14%2F15-000000?style=for-the-badge&logo=nextdotjs)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18%2F19-20232A?style=for-the-badge&logo=react)](https://react.dev/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Railway-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://railway.app/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

[🚀 Aplicação em Produção](https://sistema-seduc-psi.vercel.app) · [📊 Módulos](#-módulos) · [⚙️ Pipeline de Dados](#️-pipeline-de-dados-etl) · [📦 Instalação](#-instalação-e-execução)

</div>

---

## 📋 Visão Geral

O **Sistema SEDUC** foi desenvolvido para solucionar a consolidação de resultados avaliativos e auditoria de premiação das escolas estaduais da Secretaria de Estado de Educação do Pará (SEDUC-PA). 

O ecossistema combina rotinas automatizadas em Python para processamento de planilhas complexas, migração de Regiões de Integração (RI), resolução de empates e publicação de dados em tempo real através de uma interface web executiva.

### 🌐 Demonstração Online
Acesse o painel web: **[https://sistema-seduc-psi.vercel.app](https://sistema-seduc-psi.vercel.app)**

---

## 📊 Módulos do Sistema

| Módulo | Descrição |
| --- | --- |
| **Painel Web (Web-Seduc)** | Interface Next.js de alta performance para consulta de unidades escolares, posições no ranking e status de bonificação. |
| **Motor de Desempate** | Algoritmos de ordenação e critérios de bonificação para escolas empatadas na mesma Região de Integração (RI). |
| **Pipeline ETL (Python)** | Scripts de extração e higienização de dados a partir de arquivos `.xlsx` e relatórios `.pdf`. |
| **Repositório de Dados** | Modelagem relacional em PostgreSQL hospedado na nuvem (Railway), contendo views otimizadas e histórico de auditoria. |

---

## ⚙️ Pipeline de Dados (ETL)

O repositório inclui rotinas automatizadas em Python para tratamento dos dados oficiais:

- `extract_seduc.py`: Extração e parser dos dados brutos de desempenho e notas escolares.
- `migrar_regiao_integracao.py`: Atualização e sincronização das escolas conforme as 12 Regiões de Integração do Pará.
- `apply_full_fix.py`: Auditoria de consistência, correção de nomenclaturas e validação de vínculos institucionais.
- `upload_to_railway.py`: Carga e espelhamento direto no cluster PostgreSQL do Railway.
- `update_view.py`: Atualização das views materializadas consumidas pelo frontend.

---

## 🛠️ Tecnologias

- **Frontend:** Next.js (App Router), React, TypeScript, TailwindCSS, Lucide React.
- **Backend / Processamento:** Python 3.11+, Pandas, OpenPyXL, SQLAlchemy, Psycopg2.
- **Banco de Dados:** PostgreSQL (hospedado no Railway).
- **Hospedagem Web:** Vercel.

---

## 📁 Estrutura do Repositório

```text
Sistema-seduc/
├── web-seduc/               # Aplicação Web (Next.js / TypeScript)
│   ├── src/
│   │   ├── app/            # Páginas e rotas da aplicação
│   │   ├── components/     # Componentes visuais (HeaderBanner, Tabelas, Filtros)
│   │   └── lib/            # Conexões e queries ao banco
│   └── package.json
├── postgres/               # Scripts DDL, migrações SQL e definições de tabelas
├── resultadospdf/          # Relatórios e extratos em formato PDF
├── extract_seduc.py        # Script mestre de extração de dados
├── apply_full_fix.py       # Validador e normalizador de registros
├── migrar_regiao_integracao.py
├── upload_to_railway.py
└── requirements.txt        # Dependências Python do ecossistema
```

---

## 📦 Instalação e Execução

### 1. Aplicação Web (`web-seduc`)

```bash
cd web-seduc
npm install
npm run dev
```
Acesse [http://localhost:3000](http://localhost:3000).

### 2. Scripts de Processamento (Python)

```bash
# Na raiz do projeto:
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

pip install -r requirements.txt
python test_extraction.py
```

---

## 👨‍💻 Autor

Desenvolvido por **[João Paulo Gomes](https://github.com/jpsc17)** para a modernização da gestão pública educacional.
