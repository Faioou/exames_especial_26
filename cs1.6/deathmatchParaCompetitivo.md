Claro. Guarde este resumo porque, a partir de agora, pode alternar entre **Modo Competitivo** e **Deathmatch** sem voltar a instalar nada.

O importante é: **não volte a mexer no ReGameDLL nem no ReAPI**. Pode deixá-los permanentemente instalados.

## A) ATIVAR O MODO COMPETITIVO — `halftime.amxx`

### 1. Desligar o ReDeathmatch

Feche o CS 1.6.

Vá a:

```text
C:\Program Files (x86)\Steam\steamapps\common\Half-Life\cstrike\addons\amxmodx\configs
```

Procure:

```text
plugins-redm.ini
```

e mude o nome para:

```text
disabled-redm.ini
```

Isto desliga:

```text
ReDeathmatch.amxx
redm_spawns.amxx
```

---

### 2. Ativar o seu `halftime.amxx`

Na mesma pasta:

```text
C:\Program Files (x86)\Steam\steamapps\common\Half-Life\cstrike\addons\amxmodx\configs
```

abra:

```text
plugins.ini
```

Procure:

```text
;halftime.amxx
```

e retire o `;`:

```text
halftime.amxx
```

Guarde.

---

### 3. Tirar o YaPB do modo Deathmatch

Abra:

```text
C:\Program Files (x86)\Steam\steamapps\common\Half-Life\cstrike\addons\yapb\conf\yapb.cfg
```

Procure:

```text
yb_csdm_mode "1"
```

e coloque:

```text
yb_csdm_mode "0"
```

Guarde.

Assim o YaPB deixa de ser forçado a comportar-se como bot de Deathmatch.

---

### 4. O CSDM antigo continua DESLIGADO

Não mexa nestas configurações que já fizemos.

Em:

```text
addons\amxmodx\configs\modules.ini
```

continue com:

```text
;csdm_amxx
```

E continue com:

```text
disabled-csdm.ini
```

Não volte a ativar o CSDM 2.1.2 antigo.

---

### 5. ReGameDLL e ReAPI ficam ATIVOS

Não mexa nestes.

O seu:

```text
cstrike\dlls\mp.dll
```

continua a ser o ReGameDLL.

E no:

```text
modules.ini
```

continue com:

```text
reapi_amxx
```

Isto está correto.

---

### 6. Abrir o CS 1.6

Entre num mapa e escreva:

```text
amxx plugins
```

Deverá aparecer o seu:

```text
halftime.amxx    running
```

E **não** deverão aparecer:

```text
ReDeathmatch
ReDM: Spawns manager
```

A partir daí fica novamente com:

```text
WARMUP
   ↓
KNIFE ROUND
   ↓
ESCOLHA T / CT
   ↓
MR12
   ↓
HALFTIME
   ↓
PRIMEIRO A 13
```

---

# B) VOLTAR A ATIVAR APENAS O DEATHMATCH

Quando quiser voltar ao Deathmatch, faça exatamente o contrário.

### 1. Desligar o `halftime.amxx`

Abra:

```text
C:\Program Files (x86)\Steam\steamapps\common\Half-Life\cstrike\addons\amxmodx\configs\plugins.ini
```

Mude:

```text
halftime.amxx
```

para:

```text
;halftime.amxx
```

---

### 2. Ativar o ReDeathmatch

Na pasta:

```text
C:\Program Files (x86)\Steam\steamapps\common\Half-Life\cstrike\addons\amxmodx\configs
```

mude:

```text
disabled-redm.ini
```

para:

```text
plugins-redm.ini
```

---

### 3. Colocar o YaPB em Deathmatch

Abra:

```text
C:\Program Files (x86)\Steam\steamapps\common\Half-Life\cstrike\addons\yapb\conf\yapb.cfg
```

Mude:

```text
yb_csdm_mode "0"
```

para:

```text
yb_csdm_mode "1"
```

Isto dá-lhe o modo:

```text
TERRORISTS
     VS
COUNTER-TERRORISTS

+ respawn contínuo
```

Ou seja, **Team Deathmatch**, não FFA.

---

### 4. Não mexer no resto

Continue com:

```text
;csdm_amxx
```

e:

```text
disabled-csdm.ini
```

E continue a deixar:

```text
reapi_amxx
```

ativo.

O ReGameDLL também fica instalado.

---

### 5. Reiniciar completamente o CS 1.6

Depois escreva:

```text
amxx plugins
```

Deverá ver:

```text
ReDeathmatch          running/debug
ReDM: Spawns manager  running/debug
```

e **não deverá aparecer o `halftime.amxx` ativo**.

---

## RESUMO PARA GUARDAR

|                    | COMPETITIVO           | DEATHMATCH           |
| ------------------ | --------------------- | -------------------- |
| `halftime.amxx`    | ✅ Ativo               | ❌ Desativado         |
| `plugins-redm.ini` | ❌ `disabled-redm.ini` | ✅ `plugins-redm.ini` |
| `yb_csdm_mode`     | `"0"`                 | `"1"`                |
| ReAPI              | ✅ Sempre ativo        | ✅ Sempre ativo       |
| ReGameDLL          | ✅ Sempre instalado    | ✅ Sempre instalado   |
| CSDM antigo        | ❌ Sempre desligado    | ❌ Sempre desligado   |

Portanto, na prática, para mudar de modo só precisa de alterar **3 coisas**:

```text
COMPETITIVO
-----------
halftime.amxx       ON
ReDeathmatch        OFF
yb_csdm_mode        0


DEATHMATCH
----------
halftime.amxx       OFF
ReDeathmatch        ON
yb_csdm_mode        1
```

E **reiniciar o CS 1.6 depois de cada troca**.

Mais tarde até podemos tornar isto muito mais cómodo, criando dois ficheiros — por exemplo `COMPETITIVO.bat` e `DEATHMATCH.bat` — para mudar de modo com **um duplo clique**, sem ter de andar a editar estes ficheiros à mão.
