-- Public learning-resource catalog used by the Resources page.
CREATE TABLE IF NOT EXISTS resources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_mm TEXT,
  description TEXT,
  description_mm TEXT,
  resource_type TEXT NOT NULL DEFAULT 'pdf',
  course_id TEXT,
  course_name TEXT,
  file_url TEXT NOT NULL,
  download_url TEXT,
  is_free INTEGER NOT NULL DEFAULT 1 CHECK (is_free IN (0, 1)),
  price_amount REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'MMK',
  is_published INTEGER NOT NULL DEFAULT 1 CHECK (is_published IN (0, 1)),
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_resources_published_order
  ON resources(is_published, order_index, created_at);

INSERT INTO resources (
  id, name, name_mm, description, description_mm, resource_type,
  course_id, course_name, file_url, download_url, is_free,
  price_amount, currency, is_published, order_index
)
VALUES (
  'basic-thai-book-pdf',
  'Basic Thai Book PDF',
  'နေ့စဉ်သုံး အထူးထိုင်းစကားပြော စာအုပ်',
  'A free foundational Thai speaking book for everyday conversation practice.',
  'နေ့စဉ်သုံး ထိုင်းစကားပြောနှင့် အခြေခံဝေါဟာရများကို လေ့လာရန် အခမဲ့ PDF စာအုပ်။',
  'pdf',
  'course-basic',
  'Complete Thai Foundational Mastery Course',
  'https://drive.google.com/file/d/1GDVMsaqLRFoIIPMhOK09mbvBfPhd-i_c/view?usp=sharing',
  'https://drive.google.com/uc?export=download&id=1GDVMsaqLRFoIIPMhOK09mbvBfPhd-i_c',
  1,
  0,
  'MMK',
  1,
  1
)
ON CONFLICT(id) DO UPDATE SET
  name = excluded.name,
  name_mm = excluded.name_mm,
  description = excluded.description,
  description_mm = excluded.description_mm,
  resource_type = excluded.resource_type,
  course_id = excluded.course_id,
  course_name = excluded.course_name,
  file_url = excluded.file_url,
  download_url = excluded.download_url,
  is_free = excluded.is_free,
  price_amount = excluded.price_amount,
  currency = excluded.currency,
  is_published = excluded.is_published,
  order_index = excluded.order_index,
  updated_at = CURRENT_TIMESTAMP;
