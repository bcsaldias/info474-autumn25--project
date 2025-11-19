import pandas as pd
import csv

countries = [
    "USA", "CHN", "BRA", "MEX", "CAN", "DEU",
    "GBR", "IND", "JPN", "KOR", "NGA", "ZAF"
]

trade_path = "datasets/TradeData_11_18_2025_17_41_12.csv"
gdp_path = "datasets/API_NY/API_NY.GDP.MKTP.CD_DS2_en_csv_v2_216063.csv"
tariff_path = "datasets/API_TM/API_TM.TAX.MRCH.WM.AR.ZS_DS2_en_csv_v2_1001.csv"

# Read trade CSV with defensive parsing to handle occasional trailing empty fields
with open(trade_path, 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    header = next(reader)
    rows = []
    for row in reader:
        # drop trailing empty fields if present
        while len(row) > len(header) and row and row[-1] == "":
            row = row[:-1]
        # if length mismatch still exists, pad or truncate to header length
        if len(row) != len(header):
            if len(row) > len(header):
                row = row[:len(header)]
            else:
                row = row + [None] * (len(header) - len(row))
        rows.append(row)
trade = pd.DataFrame(rows, columns=header)

print("[debug] initial trade shape:", trade.shape)
print("[debug] trade columns:", list(trade.columns))
if trade.shape[0] > 0:
    try:
        print("[debug] first row column-value mapping:\n", list(zip(list(trade.columns), trade.iloc[0].tolist())))
    except Exception as e:
        print("[debug] couldn't print first row mapping:", e)

keep_cols = ["refYear", "reporterISO", "reporterDesc", "flowDesc", "primaryValue"]
trade = trade[keep_cols].copy()

print("[debug] after keep cols shape:", trade.shape)
print("[debug] sample rows:\n", trade.head(5))
# Ensure trade values are numeric where appropriate
trade["primaryValue"] = pd.to_numeric(trade["primaryValue"], errors="coerce").fillna(0)

# Use the GDP file to map ISO codes to country names in case the trade file
# contains full country names in `reporterDesc` instead of ISO codes.
gdp_lookup = pd.read_csv(gdp_path, skiprows=4)
country_name_map = dict(zip(gdp_lookup["Country Code"], gdp_lookup["Country Name"]))
country_names = [country_name_map.get(c) for c in countries]
print("[debug] country ISO filter:", countries)
print("[debug] country name filter (from GDP file):", country_names)

# Filter if either the ISO code matches or the reporter description matches the country name
trade = trade[(trade["reporterISO"].isin(countries)) | (trade["reporterDesc"].isin(country_names))]

# Ensure `refYear` is numeric then keep only years 2015-2023
trade["refYear"] = pd.to_numeric(trade["refYear"], errors="coerce")
trade = trade.dropna(subset=["refYear"]) 
trade["refYear"] = trade["refYear"].astype(int)
trade = trade[trade["refYear"].between(2015, 2023)]

print("[debug] after filtering shape:", trade.shape)
print("[debug] reporterISO unique:\n", trade["reporterISO"].unique() if "reporterISO" in trade.columns else [])
print("[debug] refYear unique sample:\n", trade["refYear"].unique()[:10] if "refYear" in trade.columns else [])

trade_agg = (
    trade.groupby(
        ["refYear", "reporterISO", "reporterDesc", "flowDesc"],
        as_index=False
    )["primaryValue"].sum()
)

print("[debug] trade_agg shape:", trade_agg.shape)
print("[debug] trade_agg head:\n", trade_agg.head())

trade_wide = trade_agg.pivot_table(
    index=["refYear", "reporterISO", "reporterDesc"],
    columns="flowDesc",
    values="primaryValue",
    aggfunc="sum"
).reset_index()

print("[debug] trade_wide shape:", trade_wide.shape)
print("[debug] trade_wide columns:", list(trade_wide.columns))
print("[debug] trade_wide head:\n", trade_wide.head())

cols = list(trade_wide.columns)

if "Export" in cols:
    export_series = trade_wide["Export"]
elif "Exports" in cols:
    export_series = trade_wide["Exports"]
else:
    export_series = 0

if "Import" in cols:
    import_series = trade_wide["Import"]
elif "Imports" in cols:
    import_series = trade_wide["Imports"]
else:
    import_series = 0

print("[debug] export_series type:", type(export_series))
try:
    print("[debug] export_series length:", len(export_series))
except Exception:
    print("[debug] export_series not iterable")
print("[debug] import_series type:", type(import_series))
try:
    print("[debug] import_series length:", len(import_series))
except Exception:
    print("[debug] import_series not iterable")

trade_wide["export_value_usd"] = pd.Series(export_series).fillna(0)
trade_wide["import_value_usd"] = pd.Series(import_series).fillna(0)

trade_wide["trade_balance_usd"] = (
    trade_wide["export_value_usd"] - trade_wide["import_value_usd"]
)

trade_wide = trade_wide.rename(
    columns={
        "refYear": "year",
        "reporterISO": "country_iso",
        "reporterDesc": "country_name",
    }
)

gdp_raw = pd.read_csv(gdp_path, skiprows=4)
gdp_raw = gdp_raw[gdp_raw["Country Code"].isin(countries)]

print("[debug] gdp_raw shape:", gdp_raw.shape)
print("[debug] gdp_raw columns:\n", list(gdp_raw.columns))

gdp_long = gdp_raw.melt(
    id_vars=["Country Name", "Country Code"],
    var_name="year",
    value_name="gdp_current_usd"
)

gdp_long["year"] = pd.to_numeric(gdp_long["year"], errors="coerce")
gdp_long = gdp_long.dropna(subset=["year"])
gdp_long["year"] = gdp_long["year"].astype(int)

tariff_raw = pd.read_csv(tariff_path, skiprows=4)
tariff_raw = tariff_raw[tariff_raw["Country Code"].isin(countries)]

print("[debug] tariff_raw shape:", tariff_raw.shape)
print("[debug] tariff_raw columns:\n", list(tariff_raw.columns))

tariff_long = tariff_raw.melt(
    id_vars=["Country Name", "Country Code"],
    var_name="year",
    value_name="tariff_rate_mfn"
)


tariff_long["year"] = pd.to_numeric(tariff_long["year"], errors="coerce")
tariff_long = tariff_long.dropna(subset=["year"])
tariff_long["year"] = tariff_long["year"].astype(int)

merged = trade_wide.merge(
    gdp_long,
    left_on=["year", "country_iso"],
    right_on=["year", "Country Code"],
    how="left"
)

print("[debug] after merging GDP shape:", merged.shape)
print("[debug] merged head after GDP:\n", merged.head())

merged = merged.merge(
    tariff_long,
    left_on=["year", "country_iso"],
    right_on=["year", "Country Code"],
    how="left",
    suffixes=("", "_tariff")
)

merged = merged[
    [
        "year",
        "country_iso",
        "country_name",
        "export_value_usd",
        "import_value_usd",
        "trade_balance_usd",
        "gdp_current_usd",
        "tariff_rate_mfn",
    ]
]

merged = merged.sort_values(["country_iso", "year"])

out_path = "datasets/final_trade_panel.csv"
merged.to_csv(out_path, index=False)
print(f"Saved merged dataset to {out_path}")
print(merged.head())