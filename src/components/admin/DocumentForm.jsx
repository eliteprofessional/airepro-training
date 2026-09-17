import { useState } from 'react';

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function DocumentForm({
  initial = {},
  submitLabel = 'Save',
  onSubmit,
  allowSlugEdit = true,
  autoSlugFromTitle = false,
}) {
  const [title, setTitle] = useState(initial.title || '');
  const [slug, setSlug] = useState(initial.slug || '');
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.slug));
  const [description, setDescription] = useState(initial.description || '');
  const [markdown, setMarkdown] = useState(initial.markdown || '');
  const [preview, setPreview] = useState(initial.preview !== false);
  const [download, setDownload] = useState(initial.download !== false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSubmit({
        title: title.trim(),
        slug: slug.trim(),
        description: description.trim(),
        markdown,
        preview,
        download,
      });
    } catch (err) {
      setError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      {error && (
        <p className="admin-alert admin-alert--error" role="alert">
          {error}
        </p>
      )}

      <label className="admin-field">
        <span>Title</span>
        <input
          type="text"
          value={title}
          required
          onChange={(event) => {
            const nextTitle = event.target.value;
            setTitle(nextTitle);
            if (autoSlugFromTitle && allowSlugEdit && !slugTouched) {
              setSlug(slugify(nextTitle));
            }
          }}
        />
      </label>

      <label className="admin-field">
        <span>Slug</span>
        <input
          type="text"
          value={slug}
          required
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          title="Lowercase letters, numbers, and hyphens only"
          disabled={!allowSlugEdit}
          onChange={(event) => {
            setSlugTouched(true);
            setSlug(event.target.value);
          }}
        />
        <small>Used in URLs: /training/your-slug</small>
      </label>

      <label className="admin-field">
        <span>Description</span>
        <textarea
          rows={3}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </label>

      <label className="admin-field">
        <span>Markdown</span>
        <textarea
          className="admin-markdown"
          rows={18}
          value={markdown}
          onChange={(event) => setMarkdown(event.target.value)}
          spellCheck="false"
        />
      </label>

      <div className="admin-checks">
        <label>
          <input
            type="checkbox"
            checked={preview}
            onChange={(event) => setPreview(event.target.checked)}
          />
          Allow preview
        </label>
        <label>
          <input
            type="checkbox"
            checked={download}
            onChange={(event) => setDownload(event.target.checked)}
          />
          Allow download
        </label>
      </div>

      <div className="admin-form__actions">
        <button className="button button--primary" type="submit" disabled={saving}>
          {saving ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}

export default DocumentForm;
