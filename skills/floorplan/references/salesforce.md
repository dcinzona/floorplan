# Local Salesforce floorplans

Use the normal scan → architecture → build → describe workflow and the existing [schema](schema.md). This branch maps **what the repository declares**, not a connected org. Keep the same plain-language cards, zoom levels, flows and HTML output. No org connection, retrieval, deployment, or dependency installation is needed or permitted for this branch.

## Discover the local source

1. Read `sfdx-project.json` when present. Inspect each existing `packageDirectories[].path`, including non-default packages, with paths relative to the project containing that file. In a multi-repo root, retain the repo prefix. Record namespace and package dependency declarations as context, not proof that dependencies are available or installed.
2. Without that manifest, look for Metadata API source: a `package.xml` with Salesforce metadata declarations and neighboring metadata folders. The manifest lists intended members; only files actually present provide implementation evidence. Do not assume `force-app/main/default` is the only source root.
3. Inventory the local folders below. Inspect decomposed files as well as aggregate XML (for example, fields and validation rules inside an object file). If a required area has no local evidence, say "not present in local source", not "the app has none". Note files excluded by git ignores or scan size limits when known; don't bypass ignores to read credentials or connection state.
4. Run scan.mjs as usual. Apex (`.cls`, `.trigger`), Aura bundle source and Visualforce (`.page`, `.component`) are code cards; LWC JS/HTML/CSS already are. XML is `config`: set `"include": ["code", "config"]` in architecture.json and claim the relevant source paths. Use `ignore` for irrelevant config and known generated/vendor content. Legacy aggregate files with non-XML extensions may be classified `other`: summarize their declarations on owning nodes and cite the source path rather than claiming they have file cards. Report any such coverage gap.

The scanner inventories source, but does **not** parse Salesforce metadata relationships, Apex calls/SOQL, navigation, permissions, or Salesforce virtual imports. Generic JS imports like `@salesforce/*`, `lwc`, `lightning/*` and `c/*` are hints, not proof of installed npm packages or resolved metadata. Inspect their declarations and add manual connections only when the local target is unambiguous. Do not turn automatic package hints into invented services. The automatic Screens and Health checks are not Salesforce page discovery or an access audit; use UI nodes and flows for pages, and report their limits.

## Map declarations into existing concepts

Use business areas as boundaries where the source supports them; don't create a top-level node per metadata type or a card per field. Group large object/bundle folders under meaningful children. Keep 3–9 top-level parts and the normal coverage/description targets.

| Local evidence to read | Existing node kinds | Connections to add only with evidence |
|---|---|---|
| `applications`, `tabs`, `flexipages`, `layouts`, `lwc`, `aura`, `pages`, `components`; bundle metadata and source | `ui`, with `feature`/`library` children | App → declared tab/page (`config`); page → named component (`config`); LWC/Aura/Visualforce → named local component or Apex method (`call`/`rpc`). Read actual app tabs, tab targets, FlexiPage component names, LWC imports/templates, Aura controllers/markup and Visualforce controllers/extensions. Visibility and activation declarations are not proof of what a user sees. |
| `objects` and their `fields`, or aggregate object XML | `data` | Field owner → locally evidenced target (`data`) only from explicit relationship declarations such as `type` and `referenceTo`. Retain declared relationship names where helpful; an `__c` suffix alone proves no relationship. For standard objects or external/package targets with no local definition, note the reference and missing definition rather than inventing fields or target files. |
| `classes`, `triggers`, `flows`, object `validationRules`, integration source/config such as `namedCredentials`, `externalCredentials`, `remoteSiteSettings`, `connectedApps` | `service`/`feature` for Apex, `worker` for background or record automation, `config` for rules/settings, `external` for evidenced outside services | Trigger → named object (`event`); inspected Apex/Flow → local class, subflow or object (`call`/`data`); validation rule → owning object (`config`). Trace Flow start/connector/action/subflow declarations and Apex call/query sites, not just names. Preserve declared Flow status and trigger conditions; don't call them deployed/active runtime behavior. Use `http` only for evidenced callouts, `rpc` for Apex invocations. A credential or allowed-host declaration alone is not evidence of a call. |
| `permissionsets`, `permissionsetgroups`, `mutingpermissionsets`, `profiles`, `sharingRules`, `sharingSets`, object sharing declarations and Apex sharing keywords | `config`, with meaningful access-policy children | Permission source → locally named object/field/class/page/app (`config`), labeled "declares access"; sharing rule → locally named object (`config`), labeled "declared sharing rule". Inspect decomposed permission files too. Describe grants, restrictions and sharing declarations, not effective user access. |

For every manual edge, cite a local source path and XML element or code symbol/line in its `description`. Match exact declared names, namespace and package context; ambiguous or absent targets remain a note in node `details` or an `annotation` on a mapped source file. External nodes own no files: create them only for named services supported by local evidence, with safe hostnames if useful. For a credential alias or dynamic endpoint, describe the alias/dynamic call and unknown destination; never guess the resolved URL. Apex methods, Flow actions and Lightning navigation are not HTTP routes. Don't invent route description keys or runtime endpoints.

Example using placeholders: substitute real inspected paths, not guessed metadata names.

```json
{
  "from": "<local lookup-field XML path>",
  "to": "<local target-object XML path>",
  "kind": "data",
  "label": "Declared lookup",
  "description": "<source path>: type=Lookup and referenceTo=<target name>; org deployment is unverified."
}
```

Describe every included file using the normal worksheets and descriptions JSON. XML and longer Apex files may need direct reading because worksheets are not a metadata parser. For aggregate metadata, summarize the important fields/rules in the owning node's `details`; individual declarations are not extra schema entities. Build 1–3 guided flows from traced local references (for example a page calling Apex that reads an object). Label conditional paths and source-declared automation explicitly. If a chain leaves the repo, stop at the evidenced boundary and explain what is missing.

## Evidence, access and secrets

- State "Local Salesforce source; deployment and runtime behavior unverified" in the project summary or top-level details, and include that scope in the final report. Separate verified local references from missing, external or ambiguous definitions. Planned behavior belongs in the blueprint workflow, not a source map.
- Permission sets/profiles declare access; assignments, license constraints, permission-set group muting, sharing, execution context and org configuration can change effective access. `with sharing`/`without sharing`/`inherited sharing` are source declarations, not proof of object/field permissions or runtime authorization. Do not claim a particular user can read/write a record, that a Flow runs in a particular effective context, or that an integration succeeds from local metadata alone.
- Treat secrets and auth state as out of scope. Do not read `.sf/`, `.sfdx/`, auth URLs, tokens, private keys or secret stores to discover an org. Before writing labels, descriptions, edges, notes or reports, omit secret values, credential-bearing URLs, headers and sensitive defaults. Use safe aliases and source locations only. Worksheet masking and Health do not guarantee coverage of every Salesforce secret shape; inspect safely and never copy raw credential XML into generated output.

## Refresh and completion

On refresh, inventory the local source roots again and review affected manual edges, descriptions, annotations and flows. Re-read changed XML and Apex/markup bodies even if NEXT has no review entries: generic refresh signatures don't track Salesforce semantic changes. Use describe.mjs `--all` when those descriptions need new worksheets. Remove connections whose supporting declarations were deleted; preserve user-owned custom flows as in the main workflow.

Before reporting, check that each of the four requested areas is mapped or explicitly marked as missing local evidence; config is included; each manual edge has a source citation and a real mapped target; relevant files are assigned and described; build passes; no output contains secrets. Report unmapped legacy/oversized files, unresolved package/standard metadata and the lack of org/runtime/access verification. A quiet Health report is not a Salesforce security assessment.

## Official grounding

- [Salesforce DX Project Structure and Source Format](https://developer.salesforce.com/docs/platform/sfdx-dev/guide/sfdx-dev-source-file-format.html): source can be decomposed, including objects and permission sets; inspect local files rather than assuming one file per metadata member.
- [Source Format](https://developer.salesforce.com/docs/platform/sfvscode-extensions/guide/source-format.html): examples of the Salesforce source folders used in discovery.
- [Assign Permission Sets](https://developer.salesforce.com/docs/platform/sfdx-dev/guide/sfdx-dev-assign-permset.html): deployment and user assignment are separate; local permission declarations do not establish effective user access. These links ground interpretation, not permission to connect to an org.
