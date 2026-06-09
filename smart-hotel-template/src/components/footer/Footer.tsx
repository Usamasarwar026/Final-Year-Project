import { FOOTER_DATA, WebsiteName } from "@/constant/constant";

export const Footer = () => {
  return (
    <footer className="bg-primary text-white border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-12 grid md:grid-cols-4 gap-10">
        {/* Brand */}
        <div>
          <h2 className="font-serif text-2xl text-gold"> {WebsiteName}</h2>
          <p className="mt-3 text-sm text-white/70">
            {FOOTER_DATA.brand.tagline}
          </p>
        </div>

        {/* Links */}
        <div>
          <h3 className="text-sm font-semibold text-gold mb-3">Explore</h3>
          <ul className="space-y-2 text-sm text-white/70">
            {FOOTER_DATA.exploreLinks.map((link, index) => (
              <li key={index}>
                <a href={link.href} className="hover:text-white">
                  {link.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
        {/* Support */}
        <div>
          <h3 className="text-sm font-semibold text-gold mb-3">Support</h3>
          <ul className="space-y-2 text-sm text-white/70">
            <li>
              <a href="/login" className="hover:text-white">
                Login
              </a>
            </li>
            <li>
              <a href="/signup" className="hover:text-white">
                Sign up
              </a>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-sm font-semibold text-gold mb-3">Contact</h3>
          <p className="text-sm text-white/70">
            {WebsiteName}
            <br />
            {FOOTER_DATA.contact.phone}
            <br />
            {FOOTER_DATA.contact.email}
          </p>
        </div>
      </div>

      <div className="border-t border-white/10 py-4 text-center text-xs text-white/50">
        © {new Date().getFullYear()} {WebsiteName}. All rights reserved.
      </div>
    </footer>
  );
};
