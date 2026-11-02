import { BrandLogo } from "./brand-logo";

export function PageLoader() {
  return <div className="page-loader" role="status" aria-live="polite" aria-label="Menyiapkan ruang belajar">
    <div className="loader-brand"><BrandLogo/></div>
    <div className="loader-track" aria-hidden="true"><span/></div>
    <p>Menyiapkan ruang belajarmu<span className="loading-dots" aria-hidden="true"><i/><i/><i/></span></p>
    <small>Sebentar, ya. Petualanganmu segera dimulai.</small>
  </div>;
}
