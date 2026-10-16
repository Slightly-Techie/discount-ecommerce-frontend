import { Link } from "react-router-dom";
import { MapPinOff } from "lucide-react";

import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchField } from "@/components/SearchField";

const NotFound = () => (
  <Layout mobileBar={{ kind: "title", title: "Page not found", back: "/" }}>
    <div className="container flex max-w-md flex-col items-center gap-2 pb-16 pt-6">
      <EmptyState
        icon={MapPinOff}
        title="We can’t find that page"
        description="The link may be old, or the deal may have ended. Search for it, or head back to today’s deals."
        className="pb-4"
      />
      <SearchField className="w-full" />
      <Button asChild className="mt-4">
        <Link to="/">Back to deals</Link>
      </Button>
    </div>
  </Layout>
);

export default NotFound;
