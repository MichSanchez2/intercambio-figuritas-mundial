/**
 * LISTA DE MICHEL
 *
 * Para actualizar las listas, edita los strings de MICHEL_OFFERED_RAW y MICHEL_WANTED_RAW.
 * Usa el mismo formato que genera Figuritas App:
 *   COL 🇨🇴: 2, 6, 11, 13
 *   FWC 🏆: 3, 4
 *
 * Puedes pegar la lista directamente desde la app y el parser la interpretará.
 *
 * Para cambiar el WhatsApp de Michel, edita MICHEL_WHATSAPP (solo números, sin +).
 */

export const MICHEL_WHATSAPP = import.meta.env.VITE_OWNER_WHATSAPP || '573001234567'

export const MICHEL_OFFERED_RAW = `
FWC 🏆: 2
FWC 🌎: 7
FWC 📜: 10, 13, 15, 18, 19
RSA 🇿🇦: 7, 8
KOR 🇰🇷: 4
CZE 🇨🇿: 2, 6, 10, 15, 16, 19
CAN 🇨🇦: 3, 7, 17, 18
BIH 🇧🇦: 11, 15, 16
QAT 🇶🇦: 11, 16
SUI 🇨🇭: 1
BRA 🇧🇷: 4, 14, 18
MAR 🇲🇦: 2, 6, 14, 18
SCO 🏴: 6, 9, 10, 15, 19
AUS 🇦🇺: 5, 9
TUR 🇹🇷: 1, 4, 8
GER 🇩🇪: 4, 19
CUW 🇨🇼: 13
CIV 🇨🇮: 3, 6, 7, 11, 16
NED 🇳🇱: 14, 17
JPN 🇯🇵: 3, 19
SWE 🇸🇪: 6, 10, 11, 19
TUN 🇹🇳: 12, 17
BEL 🇧🇪: 10
IRN 🇮🇷: 6, 10, 19
NZL 🇳🇿: 1
ESP 🇪🇸: 1, 5, 9
CPV 🇨🇻: 13, 14
FRA 🇫🇷: 5, 13, 15, 19
SEN 🇸🇳: 14
NOR 🇳🇴: 1, 2, 10, 18
ARG 🇦🇷: 6, 11, 16
ALG 🇩🇿: 1, 3
JOR 🇯🇴: 5, 8, 9, 12, 14, 18
COD 🇨🇩: 8, 9
ENG 🏴: 20
CRO 🇭🇷: 10
GHA 🇬🇭: 4, 5, 8, 12, 17
`.trim()

export const MICHEL_WANTED_RAW = `
FWC 🏆: 3, 4
FWC 🌎: 6
FWC 📜: 12, 14
MEX 🇲🇽: 1, 5, 9, 14, 15, 19
RSA 🇿🇦: 2, 6, 9, 14, 15, 18
KOR 🇰🇷: 2, 6, 11, 13, 16, 20
CZE 🇨🇿: 8, 11, 12, 17
CAN 🇨🇦: 1, 5, 10, 13, 14
BIH 🇧🇦: 1, 2, 4, 6, 8, 12, 13, 19, 20
QAT 🇶🇦: 2, 3, 6, 7, 8, 9, 12, 14, 17, 18, 19
SUI 🇨🇭: 3, 4, 7, 11, 13, 16, 17, 18, 20
BRA 🇧🇷: 1, 2, 3, 5, 6, 13, 16, 20
MAR 🇲🇦: 1, 3, 4, 8, 10, 13, 16, 20
HAI 🇭🇹: 2, 5, 6, 10, 13, 15, 19, 20
SCO 🏴: 7, 11, 12, 20
USA 🇺🇸: 1, 2, 7, 8, 11, 12, 19
PAR 🇵🇾: 2, 6, 7, 10, 11, 15, 19, 20
AUS 🇦🇺: 1, 2, 3, 6, 11, 13, 14, 15, 18, 19, 20
TUR 🇹🇷: 2, 6, 9, 12, 14, 17
GER 🇩🇪: 1, 3, 7, 11, 18
CUW 🇨🇼: 1, 4, 5, 7, 9, 10, 14, 15, 18, 19
CIV 🇨🇮: 1, 9, 12, 17
ECU 🇪🇨: 4, 6, 7, 10, 11, 15, 16, 17, 19, 20
NED 🇳🇱: 1, 7, 9, 10, 11, 13, 15, 16, 19
JPN 🇯🇵: 7, 8, 11, 12, 13, 16, 17
SWE 🇸🇪: 4, 5, 8, 12, 13, 14, 17, 18
TUN 🇹🇳: 2, 3, 5, 6, 7, 9, 10, 11, 13, 15, 20
BEL 🇧🇪: 4, 12, 14, 20
EGY 🇪🇬: 2, 6, 7, 9, 10, 11, 13, 14, 15, 16, 18, 19, 20
IRN 🇮🇷: 14
NZL 🇳🇿: 2, 3, 5, 6, 7, 9, 10, 11, 13, 14, 15, 16, 18, 19, 20
ESP 🇪🇸: 3, 7, 11
CPV 🇨🇻: 1, 2, 6, 10, 19
KSA 🇸🇦: 5, 9, 14, 18
URU 🇺🇾: 3, 5, 6, 7, 9, 10, 11, 12, 13, 17, 19
FRA 🇫🇷: 2, 6, 10, 18
SEN 🇸🇳: 4, 5, 7, 8, 10, 11, 12, 13, 16, 17, 19, 20
IRQ 🇮🇶: 2, 8, 9, 11, 12, 13, 15, 19, 20
NOR 🇳🇴: 4, 8, 12, 17
ARG 🇦🇷: 3, 8, 9, 12, 13, 17
ALG 🇩🇿: 6, 9, 10, 14, 15, 18, 19
AUT 🇦🇹: 3, 5, 7, 10, 15, 19
JOR 🇯🇴: 3, 13
POR 🇵🇹: 1, 4, 5, 8, 9, 12, 13, 14, 18
COD 🇨🇩: 1, 4, 5, 6, 11, 12, 16
UZB 🇺🇿: 1, 10, 15, 16, 18, 19
COL 🇨🇴: 2, 6, 11, 13, 16, 18
ENG 🏴: 3, 4, 5, 7, 8, 9, 18
CRO 🇭🇷: 1, 4, 5, 8, 9, 12, 13, 14
GHA 🇬🇭: 3, 6, 7, 10, 13, 15, 20
PAN 🇵🇦: 2, 3, 4, 6, 7, 8, 10, 11, 12, 15, 16, 17, 19, 20
CC 🥤: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13
`.trim()
