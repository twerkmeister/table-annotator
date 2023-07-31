from table_annotator import matching
from table_annotator import io
from table_annotator.data_normalization.column_processing import normalize_last_name, \
    normalize_first_name, normalise_date, normalise_prisoner_number

image_path = "data/1-1-8-1_Flossenbuerg_Nummernbuecher_HCR/0001_0/0017_10794162_1.jpg"
tables = io.read_tables_for_image(image_path)
pers_data_path = "data/1-1-8-1_Flossenbuerg_Nummernbuecher_HCR/persdata.csv"
pers_data_index = matching.read_persdata_index(pers_data_path)

table = tables[0]
df = matching.table_data_to_df(table)

normalized_last_name = normalize_last_name(df, 'NACHNAME', "x")
normalized_first_name = normalize_first_name(df, 'VORNAME', "x")
normalized_birth_date = normalise_date(df, "GEBURTSDATUM", "DOB", "x", [1850,1950])
normalized_prisoner_number = normalise_prisoner_number(df, "HAEFTLINGSNUMMER", "x")
print(df)
