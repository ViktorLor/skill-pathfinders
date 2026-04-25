import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Copy, Download, Loader2 } from "lucide-react";
import { generateCoverLetter } from "@/services/claude";
import type { CandidateProfile, JobMatch } from "@/types/unmapped";

export function CoverLetterModal({
  candidate,
  job,
  onClose,
}: {
  candidate: CandidateProfile;
  job: JobMatch;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    generateCoverLetter(candidate, job).then((t) => {
      if (active) {
        setText(t);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [candidate, job]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
  };

  const download = () => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cover-letter-${job.title.replace(/\s+/g, "-").toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Cover letter — {job.title}
            {job.company ? ` at ${job.company}` : ""}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Drafting your letter...
          </div>
        ) : (
          <>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={16}
              className="font-mono text-sm"
            />
            <div className="mt-2 flex justify-end gap-2">
              <Button variant="outline" onClick={copy}>
                <Copy className="mr-1 h-4 w-4" />
                Copy
              </Button>
              <Button onClick={download} className="bg-navy text-navy-foreground hover:bg-navy/90">
                <Download className="mr-1 h-4 w-4" />
                Download .txt
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
