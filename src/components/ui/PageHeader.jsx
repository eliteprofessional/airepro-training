export function PageHeader({ eyebrow, title, lede, actions, children }) {
  return (
    <header className="page-hero page-hero--ops">
      <div className="page-hero__text">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {lede ? <p className="lede">{lede}</p> : null}
        {children}
      </div>
      {actions ? <div className="page-hero__actions">{actions}</div> : null}
    </header>
  );
}

export default PageHeader;
