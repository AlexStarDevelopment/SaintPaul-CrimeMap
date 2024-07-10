import * as React from "react";
import Box from "@mui/joy/Box";
import Drawer from "@mui/joy/Drawer";
import Button from "@mui/joy/Button";
import List from "@mui/joy/List";
import Divider from "@mui/joy/Divider";
import { Option, Select } from "@mui/joy";

interface DrawerBasicProps {
  crimeTypes: string[];
  setCrimeTypes: (s: string) => void;
}

export default function DrawerBasic({
  crimeTypes,
  setCrimeTypes,
}: DrawerBasicProps) {
  const [open, setOpen] = React.useState(false);

  const toggleDrawer =
    (inOpen: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
      if (
        event.type === "keydown" &&
        ((event as React.KeyboardEvent).key === "Tab" ||
          (event as React.KeyboardEvent).key === "Shift")
      ) {
        return;
      }

      setOpen(inOpen);
    };

  return (
    <Box sx={{ display: "flex" }}>
      <Button
        className="btn btn-primary mt-1 mr-1"
        variant="outlined"
        color="neutral"
        onClick={toggleDrawer(true)}
      >
        Open Filters
      </Button>
      <Button
        className="btn btn-primary mt-1 ml-1"
        variant="outlined"
        color="neutral"
        onClick={() => setCrimeTypes("ALL")}
      >
        Clear Filters
      </Button>
      <Drawer size="sm" open={open} onClose={toggleDrawer(false)}>
        <Box
          sx={{ margin: 1 }}
          role="presentation"
          onKeyDown={toggleDrawer(false)}
        >
          <div className="flex place-content-between">
            <h2 className="btn btn-ghost text-lg">Filters</h2>
            <Button
              className="btn btn-ghost text-lg"
              variant="outlined"
              color="neutral"
              onClick={toggleDrawer(false)}
            >
              X
            </Button>
          </div>
          <Divider />
          {crimeTypes && (
            <List>
              <Select
                onChange={(e, newValue) => setCrimeTypes(newValue || "ALL")}
                defaultValue="ALL"
                className="select-primary w-full max-w-xs"
              >
                {crimeTypes.map((c) => {
                  return (
                    <Option key={c} value={c}>
                      {c}
                    </Option>
                  );
                })}
              </Select>
            </List>
          )}

          <Divider />
        </Box>
      </Drawer>
    </Box>
  );
}
