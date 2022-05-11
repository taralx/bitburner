import { Tab, Tabs, Typography } from "@mui/material";
import React from "react";
import { UncontrolledEditor } from "src/ScriptEditor/ui/Editor";
import { Modal } from "../React/Modal";

interface IProps {
  open: boolean;
  onClose: () => void;
}

const ns1Example = `while(true) {
    hack('n00dles');
}`;
const ns2Example = `/** @param {NS} ns */
export async function main(ns) {
	while(true) {
		await ns.hack('n00dles');
	}
}`;

export function NSSelection(props: IProps): React.ReactElement {
  const [value, setValue] = React.useState(0);

  function handleChange(event: React.SyntheticEvent, tab: number): void {
    setValue(tab);
  }

  return (
    <Modal open={props.open} onClose={props.onClose}>
      <Tabs variant="fullWidth" value={value} onChange={handleChange}>
        <Tab label="NS1" />
        <Tab label="NS2" />
      </Tabs>

      {value === 0 && (
        <>
          <Typography>
            These scripts end with '.script'. Using a very old interpreted version of javascript. It is perfect for
            beginner to programming.
          </Typography>
          <Typography>Example script using NS1:</Typography>
          <UncontrolledEditor
            initialCode={ns1Example}
            style={{
              height: "300px",
            }}
            options={{
              fontSize: 30,
              readOnly: true,
              theme: "vs-dark",
            }}
          />
        </>
      )}
      {value === 1 && (
        <>
          <Typography>
            These scripts end with '.js'. Scripts using ns2 are running natively along the game. If you know any
            programming language you should be using this. However if you're unfamiliar with javascript Promises you
            might want to read up on them a little bit before diving in.
          </Typography>
          <Typography>Example script using NS2:</Typography>
          <UncontrolledEditor
            initialCode={ns2Example}
            style={{
              height: "300px",
            }}
            options={{
              fontSize: 30,
              readOnly: true,
              theme: "vs-dark",
            }}
          />
        </>
      )}
    </Modal>
  );
}
