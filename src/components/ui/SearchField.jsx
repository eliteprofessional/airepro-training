export function SearchField({
  value,
  onChange,
  onSubmit,
  placeholder = 'Search…',
  label = 'Search',
  buttonLabel = 'Search',
}) {
  return (
    <form className="search-field" role="search" onSubmit={onSubmit}>
      <label className="visually-hidden" htmlFor="search-field-input">
        {label}
      </label>
      <input
        id="search-field-input"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
      />
      <button className="btn btn--primary" type="submit">
        {buttonLabel}
      </button>
    </form>
  );
}

export default SearchField;
