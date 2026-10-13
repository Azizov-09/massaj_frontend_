const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/features/auth/LoginPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1) Remove ArrowLeft from lucide imports
content = content.replace(
  "  Eye, EyeOff, Heart, ArrowRight, ArrowLeft, ShieldCheck,\n  Users, Lock, Stethoscope,\n  Phone, HelpCircle, Shield",
  "  Eye, EyeOff, Heart, ArrowRight, ShieldCheck,\n  Users, Lock, Stethoscope,\n  Phone, HelpCircle, Shield"
);
// Also try CRLF version
content = content.replace(
  "  Eye, EyeOff, Heart, ArrowRight, ArrowLeft, ShieldCheck,\r\n  Users, Lock, Stethoscope,\r\n  Phone, HelpCircle, Shield",
  "  Eye, EyeOff, Heart, ArrowRight, ShieldCheck,\r\n  Users, Lock, Stethoscope,\r\n  Phone, HelpCircle, Shield"
);

// 2) Remove Link from react-router-dom import
content = content.replace("import { useNavigate, Link } from 'react-router-dom';", "import { useNavigate } from 'react-router-dom';");

// 3) Replace brand logo Link -> div (CRLF)
const logoLinkOld = `            <Link\r\n              to="/landing"\r\n              className="inline-flex items-center gap-3.5 group transition-transform active:scale-95"\r\n            >`;
const logoLinkNew = `            <div className="inline-flex items-center gap-3.5">`;
content = content.replace(logoLinkOld, logoLinkNew);

// Also replace closing </Link> with </div> in the brand logo block
// We need to replace the first occurrence after line 100
const logoClosingOld = `            </Link>\r\n          </div>\r\n\r\n          {/* Center Clinical Telemetry`;
const logoClosingNew = `            </div>\r\n          </div>\r\n\r\n          {/* Center Clinical Telemetry`;
content = content.replace(logoClosingOld, logoClosingNew);

// Also fix the hover scale on the inner div
content = content.replace(
  `              <div className="w-11 h-11 rounded-[12px] bg-gradient-to-tr from-brand-600 via-brand-500 to-amber-500 flex items-center justify-center shadow-lg shadow-brand-500/25 group-hover:scale-105 transition-all">`,
  `              <div className="w-11 h-11 rounded-[12px] bg-gradient-to-tr from-brand-600 via-brand-500 to-amber-500 flex items-center justify-center shadow-lg shadow-brand-500/25">`
);

// 4) Remove the "Asosiy sahifaga qaytish" Link from the nav row
// Replace the entire nav row div content
const navRowOld = `        {/* Top navigation helper row */}\r\n        <div className="flex items-center justify-between w-full max-w-md mx-auto mb-6">\r\n          <Link\r\n            to="/landing"\r\n            className="inline-flex items-center gap-1.5 text-xs font-semibold text-charcoal-500 hover:text-brand-600 transition-colors p-1 -ml-1 rounded-[8px]"\r\n          >\r\n            <ArrowLeft className="w-4 h-4" />\r\n            <span>Asosiy sahifaga qaytish</span>\r\n          </Link>\r\n          <div className="flex items-center gap-1.5 text-xs text-charcoal-400">`;
const navRowNew = `        {/* Top navigation helper row */}\r\n        <div className="flex items-center justify-end w-full max-w-md mx-auto mb-6">\r\n          <div className="flex items-center gap-1.5 text-xs text-charcoal-400">`;
content = content.replace(navRowOld, navRowNew);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done! Changes applied.');

// Verify no /landing references remain
if (content.includes('/landing')) {
  console.log('WARNING: /landing still found!');
} else {
  console.log('OK: No /landing references remain.');
}
if (content.includes('ArrowLeft')) {
  console.log('WARNING: ArrowLeft still found!');
} else {
  console.log('OK: ArrowLeft removed.');
}
