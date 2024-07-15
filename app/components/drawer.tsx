import {
  Box,
  Button,
  Divider,
  Drawer,
  FormControl,
  InputLabel,
  List,
  MenuItem,
  Select,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import * as React from "react";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Dayjs } from "dayjs";

interface DrawerBasicProps {
  items: Crime[];
  startDate: Dayjs | null;
  setStartDate: (d: Dayjs | null) => void;
  endDate: Dayjs | null;
  setEndDate: (d: Dayjs | null) => void;
  crimeType: string;
  setCrimeTypes: (ct: string) => void;
  neighborhood: string;
  setNeighborhood: (n: string) => void;
  isFiltersOpen: boolean;
  setIsFiltersOpen: (b: boolean) => void;
}

export default function DrawerBasic({
  items,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  crimeType,
  setCrimeTypes,
  neighborhood,
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

  const handleClear = () => {
    setStartDate(null);
    setEndDate(null);
    setCrimeTypes("ALL");
    setNeighborhood("ALL");
  };

  return (
    <Box sx={{ display: "flex" }}>
      <Drawer open={isFiltersOpen} onClose={toggleDrawer(false)}>
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
              onClick={toggleDrawer(false)}
            >
              X
            </Button>
          </div>
          <Divider />
          {uniqueCrimeOptions && (
            <List>
              <FormControl fullWidth>
                <InputLabel id="demo-simple-select-label">
                  Crime Type
                </InputLabel>
                <Select
                  labelId="demo-simple-select-label"
                  id="demo-simple-select"
                  label="Crime Type"
                  value={crimeType}
                  onChange={(e) => setCrimeTypes(e.target.value || "ALL")}
                >
                  {uniqueCrimeOptions.map((c) => {
                    return (
                      <MenuItem key={c} value={c}>
                        {c}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </List>
          )}
          <Divider />
          {uniqueCrimeOptions && (
            <List>
              <FormControl fullWidth>
                <InputLabel id="select-neighborhood">Neighborhood</InputLabel>
                <Select
                  labelId="select-neighborhood"
                  id="demo-simple-select"
                  label="Neighborhood"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value || "ALL")}
                >
                  {uniqueFlatNeighborhood.map((c) => {
                    return (
                      <MenuItem key={c} value={c}>
                        {c}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </List>
          )}
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Divider />
            <DatePicker
              sx={{ marginTop: "0.5rem", marginBottom: "0.5rem" }}
              label="Start Date"
              value={startDate}
              onChange={(newValue) => setStartDate(newValue)}
            />
            <Divider />
            <DatePicker
              sx={{ marginTop: "0.5rem", marginBottom: "0.5rem" }}
              label="End"
              value={endDate}
              onChange={(newValue) => setEndDate(newValue)}
            />
            <Divider />
          </LocalizationProvider>
          <Button
            onClick={handleClear}
            sx={{ marginTop: "0.5rem", width: "100%" }}
            className="btn btn-primary"
          >
            Clear All Filters
          </Button>
        </Box>
      </Drawer>
    </Box>
  );
}
