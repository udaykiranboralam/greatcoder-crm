"use client";

import { useState, FormEvent } from "react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      phone: (form.elements.namedItem("phone") as HTMLInputElement).value,
      interest: (form.elements.namedItem("interest") as HTMLSelectElement).value,
      message: (form.elements.namedItem("message") as HTMLTextAreaElement).value,
    };

    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Submission failed");

      setSubmitted(true);
      form.reset();
    } catch {
      setError("Something went wrong. Please try again or contact us on WhatsApp.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-dark-900 mb-4">Get in Touch</h1>
        <p className="text-dark-600 max-w-2xl mx-auto">Interested in our farm plots or plantations? We&apos;d love to hear from you.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {submitted ? (
          <div className="lg:col-span-2 text-center py-20">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-dark-900 mb-2">Thank You!</h2>
            <p className="text-dark-600">We&apos;ll get back to you within 24 hours.</p>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                  {error}
                </div>
              )}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-dark-700 mb-1">Full Name</label>
                <input type="text" id="name" name="name" className="input" placeholder="Your name" required />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-dark-700 mb-1">Phone Number</label>
                <input type="tel" id="phone" name="phone" className="input" placeholder="Your phone number" required />
              </div>
              <div>
                <label htmlFor="interest" className="block text-sm font-medium text-dark-700 mb-1">I&apos;m interested in</label>
                <select id="interest" name="interest" className="input" required>
                  <option value="">Select an option</option>
                  <option value="mango">Mango Plantation</option>
                  <option value="anjeer">Anjeer (Fig) Plantation</option>
                  <option value="coconut">Coconut Plantation</option>
                  <option value="mahogany">Mahogany Plantation</option>
                  <option value="sandalwood">Red Sandalwood Plantation</option>
                  <option value="farm-plot">Farm Plot Ownership</option>
                  <option value="retreat">Weekend Farm Retreat</option>
                  <option value="organic-produce">Organic Farm Produce</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-dark-700 mb-1">Message</label>
                <textarea id="message" name="message" rows={4} className="input resize-none" placeholder="Tell us about your interest..." />
              </div>
              <button type="submit" className="btn-primary w-full">
                Send Enquiry
              </button>
            </form>

            <div className="space-y-8">
              <div className="bg-dark-50 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-4">Contact Details</h3>
                <div className="space-y-4">
                  {[
                    { icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z", label: "Sy No 165/3 & 4, Kodambal, Chitguppa, Karnataka - 585412" },
                    { icon: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z", label: "8073648872 (Phone / WhatsApp)" },
                    { icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z", label: "Service Area: Zaheerabad | Chitguppa | Kodambal | Surrounding Regions" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                      </svg>
                      <span className="text-dark-600">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-primary-50 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-3">Our Specialties</h3>
                <ul className="space-y-2 text-dark-600 text-sm">
                  <li className="flex items-center gap-2"><span className="text-primary-600 font-bold">1.</span> Organic Farming &amp; Fruit Plantations</li>
                  <li className="flex items-center gap-2"><span className="text-primary-600 font-bold">2.</span> Forestry (Mahogany &amp; Red Sandalwood)</li>
                  <li className="flex items-center gap-2"><span className="text-primary-600 font-bold">3.</span> Farm Plot Ownership Models</li>
                  <li className="flex items-center gap-2"><span className="text-primary-600 font-bold">4.</span> Weekend Retreat &amp; Nature Living</li>
                  <li className="flex items-center gap-2"><span className="text-primary-600 font-bold">5.</span> Anjeer (Fig) Plantation &amp; Dry Fig Production</li>
                </ul>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
