# Teste de geocodificação: dez novos endereços do Recife

Data: 19/10/2026. Branch: Artur-Desktop.

Resultado: 9/10 aceitos, 1 rejeitado com 422, sem falhas 503. Consultas reais realizadas pelo GeoapifyGeocodingService atual, usando a chave do ambiente. Nenhum cadastro, edição ou gravação no banco. Não foram alterados algoritmo, contratos ou protótipo durante este teste. Seleção variada de instituições públicas/comerciais; não é amostragem estatística. Bairro foi enviado ao adapter e só participa do fallback em texto quando não há número.

| Local e fonte | Logradouro | Número | Bairro | CEP | Resultado | Tempo (s) | Consultas | Latitude | Longitude |
|---|---|---|---|---|---|---:|---:|---:|---:|
| [UFPE](https://www.ufpe.br/dai) | Avenida Professor Moraes Rego | 1235 | Cidade Universitária | 50670-901 | OK | 2.29 | 1 | -8.046738 | -34.945227 |
| [UFRPE](https://www.dcc.ufrpe.br/infraestrutura/) | Rua Dom Manoel de Medeiros | s/n | Dois Irmãos | 52171-900 | 422 | 8.89 | 2 | - | - |
| [UNICAP](https://portal.unicap.br/administracao-superior) | Rua do Príncipe | 526 | Boa Vista | 50050-900 | OK | 1.71 | 1 | -8.0553786 | -34.8876749 |
| [IFPE Recife](https://sre.recife.ifpe.edu.br/contatos.php) | Avenida Professor Luiz Freire | 500 | Cidade Universitária | 50740-540 | OK | 1.5 | 1 | -8.0601622 | -34.9506201 |
| [Shopping Recife](https://www.shoppingrecife.com.br/contato/) | Rua Padre Carapuceiro | 777 | Boa Viagem | 51020-900 | OK | 0.83 | 1 | -8.1190199 | -34.9048827 |
| [RioMar Recife](https://riomarrecife.com.br/localizacao) | Avenida República do Líbano | 251 | Pina | 51110-160 | OK | 4.41 | 1 | -8.0866496 | -34.8942249 |
| [Museu do Homem do Nordeste](https://www.gov.br/conarq/pt-br/servicos-1/consulta-as-entidades-custodiadoras-de-acervos-arquivisticos-cadastradas/entidades-custodiadoras-no-estado-de-pernambuco/museu-do-homem-do-nordeste) | Avenida Dezessete de Agosto | 2187 | Casa Forte | 52061-540 | OK | 1.26 | 1 | -8.030305 | -34.925097 |
| [Museu da Cidade do Recife](https://7rm.eb.mil.br/images/7rm/outros/Guia_Tur_Familia_Militar_Pernambuco.pdf) | Praça das Cinco Pontas | s/n | São José | 50020-500 | OK | 0.6 | 1 | -8.071153 | -34.8811881 |
| [Museu do Estado de Pernambuco](https://visite.museus.gov.br/instituicoes/museu-do-estado-de-pernambuco-mepe/) | Avenida Rui Barbosa | 960 | Graças | 52050-000 | OK | 3.54 | 1 | -8.044007 | -34.901789 |
| [Fundação Gilberto Freyre](https://grupoeditorialglobal.com.br/wp-content/uploads/2024/03/regulamento-_-3o-Concurso-Internacional-de-Ensaios-_-Premio-Gilberto-Freyre-2024-2025.pdf) | Rua Dois Irmãos | 320 | Apipucos | 52071-440 | OK | 3.34 | 1 | -8.0199154 | -34.9392425 |

## Rejeição da UFRPE

Entrada: Rua Dom Manoel de Medeiros, s/n, Dois Irmãos, 52171-900. A consulta estruturada retornou um candidato de bairro em Recife e ruas homônimas em Fortaleza (CE), com CEPs 60450-125, 60011-173, 60455-372 e 60450-340 e confiança geral zero. O fallback em texto retornou localidades/ruas de outras regiões, sem candidato da via na região esperada. O 422 respeitou a regra atual: o teste não confirmou um ponto aceitável para a UFRPE. Não foi substituído o endereço por outro para melhorar o resultado.

## Limites

OK significa que a resposta passou pelos critérios de aproximação do MVP; não comprova que o ponto está no imóvel, campus ou entrada correta. Não houve validação visual dos dez pontos nem teste do fluxo HTTP de cadastro/edição. Não foi regenerado PDF.
