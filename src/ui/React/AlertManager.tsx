import React, { useState, useEffect } from "react";
import { EventEmitter } from "../../utils/EventEmitter";
import { Modal } from "./Modal";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

export const AlertEvents = new EventEmitter<[string | JSX.Element]>();

export function AlertManager(): React.ReactElement | null {
  const [alerts, setAlerts] = useState<[Set<string | JSX.Element>]>([new Set()]);
  useEffect(
    () =>
      AlertEvents.subscribe((text: string | JSX.Element) => {
        setAlerts((old) => {
          const [alerts] = old;
          if (alerts.has(text)) {
            console.log("Duplicate message");
            return old;
          }
          alerts.add(text);
          return [alerts];
        });
      }),
    [],
  );

  useEffect(() => {
    function handle(this: Document, event: KeyboardEvent): void {
      if (event.code === "Escape") {
        setAlerts([new Set()]);
      }
    }
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, []);

  let current: string | JSX.Element | null = null;
  for (const alert of alerts[0]) {
    current = alert;
    break;
  }

  function close(): void {
    setAlerts(orig => {
      if (current == null) return orig;
      const [alerts] = orig;
      alerts.delete(current);
      return [alerts];
    });
  }

  return current == null ? null : (
    <Modal open={true} onClose={close}>
      <Box overflow="scroll" sx={{ overflowWrap: "break-word", whiteSpace: "pre-line" }}>
        <Typography component={"span"}>{current}</Typography>
      </Box>
    </Modal>
  );
}
