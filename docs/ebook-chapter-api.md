# eBook Chapter API

The eBook chapter backend models the four reader tabs as relational D1 content:

- `vocabulary` — Myanmar, phonetic, Thai, optional English and audio URL
- `verb` — prefix (`จะ`), base verb, combined phrase, translations and audio URL
- `qa` — paired question and answer translations with independent audio URLs
- `conversation` — sentence cards with translations, optional speaker and audio URL

## Public read endpoints

### List chapters

```http
GET /api/ebook-chapters?ebookId=sayar-son-jai-blue-book
```

Returns published chapter metadata and row counts for each tab.

### Read one chapter

```http
GET /api/ebook-chapters/sayar-son-jai-blue-book/1
```

Optional query parameters:

- `section=vocabulary|verb|qa|conversation` limits the returned arrays.
- `search=<text>` searches Thai, Myanmar, phonetic, English, and speaker fields.

The response contains `ebook`, `chapter`, `sections`, `vocabulary`, `verbs`, `qa`,
`conversations`, and `counts` under `data`.

## Admin CRUD endpoints

The existing authenticated CMS endpoint supports these entities:

```text
/api/admin/content/ebook-chapters
/api/admin/content/ebook-chapter-sections
/api/admin/content/ebook-chapter-vocabulary
/api/admin/content/ebook-chapter-verbs
/api/admin/content/ebook-chapter-qa
/api/admin/content/ebook-chapter-conversations
```

Use `GET` for paginated listing, `POST` to create, `PUT`/`PATCH` to update, and
`DELETE ?id=<record-id>` to delete. Child records accept `chapter_id` as a filter.

## JSON and CSV transfer

Administrators can export every chapter, one eBook, or one chapter through the
dedicated transfer endpoint:

```text
GET /api/admin/ebook-chapters-transfer?format=json
GET /api/admin/ebook-chapters-transfer?format=csv&ebookId=sayar-son-jai-blue-book
GET /api/admin/ebook-chapters-transfer?format=json&ebookId=sayar-son-jai-blue-book&chapterNumber=1
```

Send either downloaded format back to the same endpoint with `POST`. Use
`Content-Type: application/json` for JSON and `Content-Type: text/csv` for CSV.
The request must include the normal administrator header.

JSON uses `schemaVersion: 1` and a `chapters` array. Each item contains a
`chapter` object plus `sections`, `vocabulary`, `verbs`, `qa`, and
`conversations` arrays. Both snake_case export fields and the camelCase fields
returned by the learner API are accepted on import.

CSV is a single UTF-8 file with one `record_type` per row. Supported types are
`chapter`, `section`, `vocabulary`, `verb`, `qa`, and `conversation`. Every
nested row links to its parent through `chapter_id`; quoted commas, quotes,
newlines, and Thai/Myanmar Unicode are preserved.

Imports are intentionally replace-mode: chapter metadata is upserted and all
tab records for each included chapter are replaced in one D1 batch. Validation
runs before any writes, checks parent eBooks and chapter identity conflicts,
and rejects files larger than 5 MB, more than 100 chapters, or more than 2,000
nested records. Chapters not present in the import file are not changed.

## Migration

Apply `migrations/0004_ebook_chapter_layout.sql` before deploying the APIs. It
creates all chapter tables and seeds the Sayar Son Jai Blue Book reference chapter.
