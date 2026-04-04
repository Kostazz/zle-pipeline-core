# zle-pipeline-core

Validace schématu u produktových obrázků nestačí. Tohle CLI zastaví chyby v názvech a assetech hned na začátku, ještě než rozbijí publish.

## Problém

Týmy často posílají datasety, které jsou sice validní JSON, ale provozně nefungují: duplicitní ID, slabé názvy souborů, chybějící kandidát na cover image nebo nekonzistentní sady obrázků. Tyto chyby se obvykle projeví až později při publishi nebo vykreslení storefrontu.

`zle-pipeline-core` je malá fail-closed pipeline přesně pro tuhle mezeru: **ingest → curate → stage → publish**.

## Reálné problémy, které to zachytí

- Duplicitní product ID v jednom běhu.
- Produkty bez zdrojových obrázků.
- Produkty bez použitelného kandidáta na cover image.
- Zdrojové sady větší, než dovoluje policy (max 5).
- Nepodporované přípony obrázků.
- Podezřelé source cesty (`..`, absolutní cesty, backslashe, neplatné znaky).

## Policy rozhodnutí (explicitně)

Tenhle projekt záměrně používá přísné výchozí nastavení, aby byla pipeline deterministická:
- Pravidlo pro cover kandidáta: název souboru musí obsahovat `cover`, `hero` nebo `main`.
- Povolené přípony: `.jpg`, `.jpeg`, `.png`, `.webp`.
- Path hygiene: pouze lokální relativní cesty, bez traversal patternů.

Tohle jsou **policy volby**, ne univerzální pravdy. Pro svůj domain je upravíš v `src/core/image-rules.ts`.

## Fail-closed chování (prakticky)

Pokud selže validace, staging nebo kontrola konzistence manifestu, příkaz skončí s nenulovým kódem a pipeline se zastaví. Žádný částečný publish stav.

Každá stage znovu validuje soubory, které načítá (`curated.json`, `manifest.json`), jako nedůvěryhodný vstup.
Product ID v manifestu musí odpovídat stejné lowercase slug policy (`^[a-z0-9-]+$`).

## Bezpečnost filesystému

`runId` se před vytvořením jakýchkoli cest ověřuje přes allowlist (`^run-[A-Za-z0-9_-]+$`), takže `curate/stage/publish` se přes podvržené ID nedostanou mimo `tmp/`.


## Struktura repozitáře

```text
zle-pipeline-core/
  package.json
  tsconfig.json
  README.md
  LICENSE
  .gitignore
  src/
    cli/
      ingest.ts
      curate.ts
      stage.ts
      publish.ts
    core/
      schema.ts
      validate.ts
      manifest-schema.ts
      image-rules.ts
      images.ts
      pipeline.ts
    utils/
      fs.ts
      log.ts
    index.ts
  examples/
    dataset.json
    run.sh
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
npm run ingest  # prints RUN_ID=<value>
npm run curate -- --run-id <RUN_ID>
npm run stage -- --run-id <RUN_ID>
npm run publish -- --run-id <RUN_ID>
```

## Struktura výstupu

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

Aby týmy měly kompaktní a důvěryhodné jádro s přísnými quality gates pro image sety ještě před přidáním storage, processingu a orchestrace.

## Sponzoring

Jestli tohle pomáhá vašim operacím nad produktovými daty, sponzoring přímo podporuje údržbu.
