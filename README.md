# zle-pipeline-core

Validace schématu u produktových obrázků nestačí.  
Tohle CLI zastaví chyby v názvech a assetech dřív, než rozbijí staging nebo publish.

## Problém

Týmy často pouští do pipeline datasety, které jsou validní JSON, ale provozně nefungují:

- duplicitní product ID
- slabé nebo nekonzistentní názvy souborů
- chybějící cover image
- rozbité nebo neúplné image sety

Tyhle chyby se většinou projeví až pozdě při publishi nebo ve storefrontu.

`zle-pipeline-core` je malá fail-closed pipeline přesně pro tuhle mezeru:

`ingest → curate → stage → publish`

## Co to reálně chytí

- duplicitní product ID v jednom runu
- produkty bez source images
- produkty bez použitelného cover image
- source sety větší, než dovoluje policy (max 5)
- nepodporované přípony obrázků
- podezřelé source paths (`..`, absolutní cesty, backslashe, neplatné znaky)

## Policy (vědomé rozhodnutí)

Tenhle projekt používá přísná výchozí pravidla, aby byl výstup deterministický:

- **cover candidate**: název obsahuje `cover`, `hero` nebo `main`
- **povolené přípony**: `.jpg`, `.jpeg`, `.png`, `.webp`
- **path hygiene**: pouze lokální relativní cesty, bez traversal patternů

Tohle nejsou univerzální pravdy.  
Jsou to záměrné policy volby pro tenhle core.  
Přizpůsobíš je v `src/core/image-rules.ts`.

## Fail-closed chování

Když selže validace, staging nebo kontrola manifestu, příkaz skončí s nenulovým exit codem a pipeline se zastaví.

Žádný tichý průchod.  
Žádný částečný publish.

Každá stage znovu validuje vstupy (`curated.json`, `manifest.json`) jako nedůvěryhodná data.

Product ID musí odpovídat slug patternu:

```
^[a-z0-9-]+$
```

## Bezpečnost filesystemu

`runId` se validuje proti allowlistu:

```
^run-[A-Za-z0-9_-]+$
```

Díky tomu se `curate`, `stage` a `publish` nedostanou mimo `tmp/` ani při podvrženém ID.

## Struktura

```text
zle-pipeline-core/
  src/
    cli/
    core/
    utils/
  examples/
```

## Instalace

```bash
npm install
```

## Použití

### Happy path

```bash
npm run demo
```

### Manuální flow

```bash
npm run ingest   # prints RUN_ID=<value>
npm run curate -- --run-id <RUN_ID>
npm run stage -- --run-id <RUN_ID>
npm run publish -- --run-id <RUN_ID>
```

### Example output

```bash
Ingest complete. runId=run-abc123
Curate complete. products=3
Stage complete. artifacts written
Publish ready. all checks passed
```

## Výstup

```text
tmp/
  <runId>/
    dataset.json
    curated.json
    manifest.json
    products/
      <productId>/
        cover.jpg
        01.jpg
```

## Proč to existuje

Aby týmy měly malé, důvěryhodné jádro pro přísné quality gates nad image sety ještě před tím, než přidají storage, processing nebo orchestration.

## Sponzoring

Pokud ti tenhle projekt šetří čas nebo odhaluje chyby dřív, než se projeví v produkci, můžeš ho podpořit sponzoringem.
