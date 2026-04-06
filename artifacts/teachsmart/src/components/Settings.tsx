import React from "react";
import { Globe } from "lucide-react";
import { LANGUAGES, type LangCode } from "../lib/translations";

type Props = {
  uiLanguage: LangCode;
  onUiLanguageChange: (lang: LangCode) => void;
  fontSize: 'small' | 'medium' | 'large';
  onFontSizeChange: (size: 'small' | 'medium' | 'large') => void;
  highContrast: boolean;
  onHighContrastChange: (v: boolean) => void;
};

export default function Settings({ uiLanguage, onUiLanguageChange, fontSize, onFontSizeChange, highContrast, onHighContrastChange }: Props) {
  const sectionClass = "bg-white rounded-2xl shadow-sm border border-border p-6 mb-5";
  const labelClass = "block text-[12px] font-semibold uppercase tracking-wider text-slate-500 mb-2";

  return (
    <div className="flex-1 ml-60 flex flex-col min-h-screen bg-slate-50">
      <div className="bg-white px-8 py-5 border-b border-border">
        <div className="font-serif text-[22px] text-foreground tracking-tight">Settings</div>
        <div className="text-[13px] text-muted-foreground mt-0.5">Personalise your TeachSmart experience</div>
      </div>

      <div className="p-8 flex-1">
        <div className="max-w-2xl mx-auto">
          <div className={sectionClass}>
            <div className="flex items-center gap-2 mb-5">
              <Globe className="w-4 h-4 text-primary" />
              <div className="text-[15px] font-bold text-foreground">Language & Voice</div>
            </div>
            <label className={labelClass}>Interface language</label>
            <div className="grid grid-cols-2 gap-2 mb-5">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => onUiLanguageChange(lang.code)}
                  aria-label={`Switch to ${lang.label}`}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-[13px] font-medium cursor-pointer transition-colors text-left ${uiLanguage === lang.code ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-white text-slate-600 hover:border-slate-300'}`}
                >
                  <span className="text-xl">{lang.flag}</span>
                  <div>
                    <div className="font-semibold">{lang.label}</div>
                    <div className="text-[11px] opacity-60">{lang.voiceCode}</div>
                  </div>
                </button>
              ))}
            </div>
            <div className="bg-teal-50 border border-teal-100 rounded-xl px-4 py-3 text-[13px] text-teal-700">
              <strong>Voice input</strong> automatically uses the selected language. Microphone buttons appear next to each text field throughout the app.
            </div>
          </div>

          <div className={sectionClass}>
            <div className="text-[15px] font-bold text-foreground mb-5">Accessibility</div>
            <label className={labelClass}>Font size</label>
            <div className="flex gap-2 mb-5">
              {(['small', 'medium', 'large'] as const).map(size => (
                <button
                  key={size}
                  onClick={() => onFontSizeChange(size)}
                  aria-label={`Font size: ${size}`}
                  className={`flex-1 py-2.5 rounded-xl border-2 text-[13px] font-medium cursor-pointer transition-colors capitalize ${fontSize === size ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-white text-slate-600 hover:border-slate-300'}`}
                >
                  <span style={{ fontSize: size === 'small' ? 12 : size === 'large' ? 16 : 14 }}>{size.charAt(0).toUpperCase() + size.slice(1)}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between py-3 border-t border-border">
              <div>
                <div className="text-[14px] font-semibold text-foreground">High contrast mode</div>
                <div className="text-[12px] text-slate-500">Increases text contrast for better readability</div>
              </div>
              <button
                onClick={() => onHighContrastChange(!highContrast)}
                aria-label={highContrast ? "Disable high contrast" : "Enable high contrast"}
                className={`w-11 h-6 rounded-full relative border-none cursor-pointer transition-colors ${highContrast ? 'bg-primary' : 'bg-slate-200'}`}
              >
                <span className={`absolute w-4.5 h-4.5 bg-white rounded-full top-[3px] transition-transform ${highContrast ? 'translate-x-[22px]' : 'translate-x-[3px]'}`} style={{ width: 18, height: 18 }} />
              </button>
            </div>
          </div>

          <div className={sectionClass}>
            <div className="text-[15px] font-bold text-foreground mb-2">About TeachSmart</div>
            <div className="text-[13px] text-slate-500 leading-relaxed">
              TeachSmart is a curriculum-aligned resource finder for Australian teachers (Years 7–12). Powered by Anthropic Claude AI and Australian Curriculum v9 data. All AI responses use live BOM weather data, real CSIRO datasets, and authentic Australian curriculum outcomes.
            </div>
            <div className="mt-3 text-[12px] text-slate-400">Version 2.0 · NSW, VIC, QLD, WA, SA aligned</div>
          </div>
        </div>
      </div>
    </div>
  );
}
