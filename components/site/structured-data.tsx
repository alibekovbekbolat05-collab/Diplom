import { site } from "@/config/site";
import { company } from "@/config/company";
export function StructuredData() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", name: company.name, url: site.url },
      {
        "@type": "WebApplication",
        name: "SecureOps",
        applicationCategory: "SecurityApplication",
        operatingSystem: "Web",
        url: `${site.url}/ru/product`,
        inLanguage: ["ru", "en", "kk"],
      },
    ],
  };
  return (
    <script type="application/ld+json">
      {JSON.stringify(data).replace(/</g, "\\u003c")}
    </script>
  );
}
