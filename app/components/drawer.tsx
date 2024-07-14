import * as React from "react";
import Box from "@mui/joy/Box";
import Drawer from "@mui/joy/Drawer";
import Button from "@mui/joy/Button";
import List from "@mui/joy/List";
import Divider from "@mui/joy/Divider";
import { Option, Select } from "@mui/joy";
import { Dispatch, SetStateAction } from "react";

interface DrawerBasicProps {
  items: Crime[];
  setCrimeTypes: (s: string) => void;
  setNeighborhood: Dispatch<SetStateAction<string>>;
  isFiltersOpen: boolean;
  setIsFiltersOpen: (b: boolean) => void;
}

export default function DrawerBasic({
  items,
  setCrimeTypes,
  setNeighborhood,
  isFiltersOpen,
  setIsFiltersOpen,
}: DrawerBasicProps) {
  function getUniqueStrings(arr: string[]): string[] {
    return [...new Set(arr)];
  }

  const flat = items.flatMap((i) => i.INCIDENT);
  const flatNeighborhood = items.flatMap((i) => i.NEIGHBORHOOD_NAME);
  flat.unshift("ALL");
  flatNeighborhood.unshift("ALL");
  const uniqueFlatNeighborhood = getUniqueStrings(flatNeighborhood);
  const uniqueCrimeOptions = getUniqueStrings(flat);

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

      setIsFiltersOpen(inOpen);
    };

  return (
    <Box sx={{ display: "flex" }}>
      <Drawer size="sm" open={isFiltersOpen} onClose={toggleDrawer(false)}>
        <Box
          sx={{ margin: 1 }}
          role="presentation"
          onKeyDown={toggleDrawer(false)}
        >
          <div className="flex place-content-between">
            <h2 className="btn btn-ghost text-lg font-bold">Filters</h2>
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
          {uniqueCrimeOptions && (
            <List>
              <label
                className="mb-1"
                htmlFor="select-crime-type"
                id="select-label"
              >
                Crime Type:
              </label>
              <Select
                listboxId="select-crime-type"
                onChange={(e, newValue) => setCrimeTypes(newValue || "ALL")}
                defaultValue="ALL"
                className="select-primary w-full max-w-xs"
              >
                {uniqueCrimeOptions.map((c) => {
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
          {uniqueFlatNeighborhood && (
            <List>
              <label
                className="mb-1"
                htmlFor="select-neighborhood"
                id="select-label-2"
              >
                Neighborhood:
              </label>
              <Select
                listboxId="select-neighborhood"
                onChange={(e, newValue) => setNeighborhood(newValue || "ALL")}
                defaultValue="ALL"
                className="select-primary w-full max-w-xs"
              >
                {uniqueFlatNeighborhood.map((c) => {
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
