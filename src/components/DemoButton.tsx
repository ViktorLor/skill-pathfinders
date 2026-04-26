import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Sparkles, X } from "lucide-react";

export function DemoButton() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const go = (id: string) => {
    setOpen(false);
    navigate({ to: "/profile/$id", params: { id } });
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open && (
        <div className="mb-2 w-64 rounded-lg border border-border bg-card p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("demo.profiles")}
            </span>
            <button
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => go("demo-tech")}
              className="rounded-md border-l-4 border-navy bg-surface px-3 py-2 text-left text-sm hover:bg-muted"
            >
              {t("demo.techKwame")}
            </button>
            <button
              onClick={() => go("demo-trade")}
              className="rounded-md border-l-4 border-sky bg-surface px-3 py-2 text-left text-sm hover:bg-muted"
            >
              {t("demo.tradeAmara")}
            </button>
            <button
              onClick={() => go("demo-agri")}
              className="rounded-md border-l-4 border-greenT bg-surface px-3 py-2 text-left text-sm hover:bg-muted"
            >
              {t("demo.agriKofi")}
            </button>
          </div>
        </div>
      )}
      <Button
        onClick={() => setOpen((o) => !o)}
        size="sm"
        variant="secondary"
        className="rounded-full shadow-md"
      >
        <Sparkles className="mr-1 h-4 w-4" />
        {t("demo.button")}
      </Button>
    </div>
  );
}
