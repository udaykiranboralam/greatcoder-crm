import Link from "next/link";
import { GraduationCap, Mail, MapPin, Phone } from "lucide-react";

const quickLinks = [
  { href: "/", label: "Home" },
  { href: "/courses", label: "Courses" },
  { href: "/career-counselor", label: "Talk to Priya" },
  { href: "/book-demo", label: "Book Free Demo" },
  { href: "/login", label: "Counselor Login" },
];

const courses = [
  "DevOps",
  "DevSecOps",
  "Cyber Security",
  "Ethical Hacking",
  "Python Full Stack",
  "Java Full Stack",
  "Data Science",
  "Cloud Computing",
];

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-600">
                <GraduationCap className="h-5 w-5 text-white" />
              </span>
              <span className="text-xl font-bold tracking-tight text-white">
                Great<span className="text-red-500">Coder</span>
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
              AI-powered admissions &amp; career counseling for IT training in
              Madhapur, Hyderabad. Learn, build, and launch your tech career.
            </p>
            <a
              href="https://thegreatcoder.com"
              className="mt-4 inline-block text-sm text-slate-400 underline-offset-4 hover:text-white hover:underline"
            >
              thegreatcoder.com
            </a>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Contact
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <a
                  href="tel:+919959011934"
                  className="transition-colors hover:text-white"
                >
                  +91 99590 11934
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <span>Madhapur, Hyderabad, Telangana, India</span>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <a
                  href="mailto:admissions@thegreatcoder.com"
                  className="transition-colors hover:text-white"
                >
                  admissions@thegreatcoder.com
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Quick Links
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-slate-400 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Our Courses
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {courses.map((name) => (
                <li key={name}>
                  <Link
                    href="/courses"
                    className="text-slate-400 transition-colors hover:text-white"
                  >
                    {name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-8 sm:flex-row">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} GreatCoder Trainings. All rights
            reserved.
          </p>
          <p className="text-xs text-slate-500">
            Powered by <span className="font-medium text-slate-400">GreatCoder AI</span>
          </p>
        </div>
      </div>
    </footer>
  );
}