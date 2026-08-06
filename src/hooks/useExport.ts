import { useCallback, useRef, useState } from 'react';
import { Linking, Platform } from 'react-native';
import * as financeApi from '@/api/finance';
import type { ExportKind } from '@/api/finance';

/** How long to keep asking before telling the studio to come back. */
const POLL_ATTEMPTS = 15;
const POLL_INTERVAL_MS = 2000;

/**
 * Asks for a CSV and downloads it.
 *
 * <b>Extracted from `PaymentReportModal`, which had the only copy.</b> Adding the receivables
 * download would have made two, and the parts that would drift are the ones that took thinking:
 * that a queued export must be polled and then given up on rather than spun forever, that the
 * pre-signed link is opened rather than fetched into memory, and that web and native open it
 * differently.
 *
 * <b>Two shapes from one call</b> (backend ADR-0041). At or under two thousand rows the server
 * renders inline and hands back a link; above it the work moved to a job and the ticket comes back
 * `Queued`. The caller cannot know which side of the cap it is on before asking, so it does not try.
 *
 * <b>CSV only, and that is the whole format story.</b> `Xlsx` and `Pdf` are registered wire values
 * with no renderer behind them — the first wants a spreadsheet library, the second is blocked on
 * plan decision D24, which is a licence question rather than work. The server refuses them by name
 * with a message naming CSV, so a format picker here would be a menu of two dead options.
 */
export function useExport(onNotify: (message: string) => void) {
  const [exporting, setExporting] = useState(false);

  // Guards a late response from a run the caller has replaced. Without it, clicking twice can leave
  // the first run's message under the second run's result.
  const generation = useRef(0);

  const download = useCallback(
    async (kind: ExportKind, from: string | null, to: string | null): Promise<boolean> => {
      const run = ++generation.current;

      setExporting(true);

      try {
        let ticket = await financeApi.requestExport({
          kind,
          format: 'Csv',
          from,
          to,
          memberId: null,
        });

        // Bounded, and it gives up rather than polling forever. A studio told "still working" after
        // half a minute is better served by being told to check back than by a spinner that never
        // resolves — the row is durable and the export is still coming.
        for (let attempt = 0; attempt < POLL_ATTEMPTS && ticket.status !== 'Completed'; attempt++) {
          if (ticket.status === 'Failed') break;

          await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));

          if (generation.current !== run) return false;

          ticket = await financeApi.getExport(ticket.exportId);
        }

        if (generation.current !== run) return false;

        if (ticket.status === 'Failed') {
          onNotify('Dosya hazırlanamadı. Tekrar dene.');
          return false;
        }

        if (ticket.status !== 'Completed' || !ticket.downloadUrl) {
          // Not a failure: the job may still finish. Saying so is the difference between a studio
          // asking again in a minute and a studio filing a bug.
          onNotify('Dosya hazırlanıyor. Birazdan tekrar dene.');
          return false;
        }

        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          // The link is pre-signed and short-lived, so opening it is the download. Nothing is
          // fetched into memory here: a year of payments is a file, not a string.
          window.open(ticket.downloadUrl, '_blank', 'noopener');
        } else {
          await Linking.openURL(ticket.downloadUrl);
        }

        onNotify(`${ticket.rowCount} satır indiriliyor.`);

        return true;
      } catch (error) {
        if (generation.current !== run) return false;

        // The server's own words where it has any: a refused format names CSV, and that is more use
        // to the reader than anything this file could invent.
        onNotify(error instanceof Error ? error.message : 'Dosya indirilemedi.');

        return false;
      } finally {
        if (generation.current === run) setExporting(false);
      }
    },
    [onNotify],
  );

  return { exporting, download };
}
