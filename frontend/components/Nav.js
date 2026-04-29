import Link from "next/link";

export default function Nav() {
  return (
    <nav className="nav">
      <Link className="nav__brand" href="/">
        Panenka
      </Link>
      <div className="nav__links">
        <Link href="/product">Product</Link>
        <Link href="/demo">Demo</Link>
        <Link href="/about">About</Link>
      </div>
    </nav>
  );
}
