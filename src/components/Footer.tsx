import { Link } from "react-router-dom";

// Support contacts (WhatsApp, phone, hours) and policy pages are not in place yet,
// so the footer only links to destinations that exist.
export function Footer() {
  return (
    <footer className="border-t bg-muted">
      <div className="container grid gap-8 py-10 sm:grid-cols-3">
        <nav aria-label="Shop" className="flex flex-col gap-2.5 text-[15px]">
          <strong>Shop</strong>
          <Link to="/products" className="text-primary hover:text-primary-strong">All deals</Link>
          <Link to="/favorites" className="text-primary hover:text-primary-strong">Saved deals</Link>
          <Link to="/cart" className="text-primary hover:text-primary-strong">Cart</Link>
        </nav>
        <nav aria-label="Help" className="flex flex-col gap-2.5 text-[15px]">
          <strong>Help</strong>
          <Link to="/orders" className="text-primary hover:text-primary-strong">Track an order</Link>
          <Link to="/profile" className="text-primary hover:text-primary-strong">Your account</Link>
        </nav>
        <nav aria-label="GrottoMore" className="flex flex-col gap-2.5 text-[15px]">
          <strong>GrottoMore</strong>
          <Link to="/register?as=vendor" className="text-primary hover:text-primary-strong">List your deals as a vendor</Link>
        </nav>
      </div>
      <p className="container border-t py-4 pb-7 text-[13px] text-muted-foreground">
        Prices and stock come from retailer and vendor listings and can change before you order. All prices in Ghana
        cedis. © {new Date().getUTCFullYear()} GrottoMore
      </p>
    </footer>
  );
}
