import table_annotator.data_normalization.regex_conditions as rc
import re
from tqdm import tqdm
import pandas as pd
tqdm.pandas()

# ---------------------------------------------------------------
# small functions reused for different column processing
# ---------------------------------------------------------------

def clean_copy(df,
               col_name: str):
    """This function is for the general cleaning and normalisation of characters
    present in a column to process it smoother"""

    col = df[col_name]

    col = col.str.strip()
    col = col.replace(
        to_replace=[rc.dash_words,
                    rc.deleted_words,
                    rc.question_mark_words,
                    rc.semicolon_words],
        value=['-', '', '?', ';'],
        regex=True
    )

    col = col.replace(
        to_replace=[
            ';+',
            '^\s*;\s*|\s*;\s*$|^\s+|\s+$|[\n\t]*',
            '-+|^$'],
        regex=True
    )

    return col


def clean_copy_2(col):
    """This function is for the general cleaning and normalisation of characters
    present in a column to process it smoother"""

    col = col.str.strip()
    col = col.replace(
        to_replace=[
            rc.dash_words,
            rc.deleted_words,
            rc.question_mark_words,
            rc.semicolon_words
        ],
        value=['-', '', '?', ';'],
        regex=True)

    col = col.replace(
        to_replace=[
            ';+',
            '^\s*;\s*|\s*;\s*$|^\s+|\s+$|[\n\t]*',
            '-+|^$'],
        value=[';', '', '-'],
        regex=True)

    return col


# ---------------------------------------------------------------

def create_qa_col(column,
                  qa_regex,
                  qa_no_entry_regex):
    """create a QA column based on the qa_regex conditions and skips
    qa_no_entry_regex conditions"""

    qa_col = column.astype(
        str
    ).str.contains(
        qa_regex
    )

    # check if Name column just consists of '-', if yes remove qa flagging
    qa_col_no_entry = ~column.astype(
        str
    ).str.contains(
        qa_no_entry_regex,
        na=False
    )
    qa_col = qa_col & qa_col_no_entry

    return qa_col


# ---------------------------------------------------------------

def date_integer_separator(x):
    """takes a date integer and adds two dots to separate it as a date"""

    date = str(re.sub('[^0-9]',
                      '',
                      str(x)))

    return date[:2] + ';' + date[2:4] + ';' + date[4:]


# ---------------------------------------------------------------

def date_validity_check(series, upper, lower):
    """checks if values of a series (pandas df column) is within a defined range.
    returns a boolean series.First check is if there are only numbers in a
    cell of the series, if yes: Check if within the upper and lower range.
    Zeros are not flagged."""

    return series.apply(
        lambda x: (
            (
                True if (int(x) > upper) or (int(x) < lower) else False
            ) if int(x) != 0 else False)
        if (
               bool(
                   re.search(
                       r'[^0-9]+',
                       str(x)
                   )
               ) is False
           ) and (
                bool(
                    re.search(
                        r'[0-9]+',
                        str(x)
                    )
                ) is True
        ) else True if len(str(x)) > 0 else False
    )


# ---------------------------------------------------------------

def keyword_removal(col):
    """This function removes specific keywords from a column"""

    return col.str.lower().replace(
        to_replace=rc.key_words_regex,
        value='',
        regex=True
    )


# ---------------------------------------------------------------

def sort_list_in_column(col):
    """
    This function converts ";" - separated pd.Series strings into lists, sorts them by
    numerical value and joins them back into a string
    """

    # sort prisoner numbers by numeric part of the prisoner number:
    col_list = col.apply(
        lambda x: str(x).split(';')
    )

    # remove characters from the list
    number_lst_col = col_list.apply(
        lambda str_lst: [re.sub(r'[^0-9]+',
                                '',
                                x) for x in str_lst]
    )

    # return index positions if list numeric values in list are sorted ascending

    sorted_col = number_lst_col.apply(
        lambda x: sorted(
            range(len(x)),
            key=x.__getitem__
        )
    )

    # apply the index to the real list of indices
    lambda_func = lambda x, y: [x[i] for i in y]

    col_list = pd.Series(
        list(
            map(
                lambda_func,
                col_list,
                sorted_col)
        ), index=sorted_col.index
    )

    col = col_list.apply(
        lambda x: ';'.join(x)
    )

    return col


# ---------------------------------------------------------------
def name_consistency_check(*dfs):
    """
    This function takes all created name columns and merges them into on dataframe.
    Then it checks if the content of the birth name columns is already present
    in any other name column. If so, the respective birth name column is emptied.

    Parameters
    ----------
    *dfs : pandas.DataFrame
        All created name dataframes

    Returns
    -------
    df : pandas.DataFrame
        A single dataframe containing the merged input dfs which have been checked
        for consistency regarding the filling of the birth name columns.

    """

    # merge all name dataframes together
    df = pd.concat(dfs, axis=1)

    col_list = df.columns

    # integrate birth_name extracted into birth_name_cleaned columns if possible

    # select the birth_name_cleaned columns from the column list:
    birth_name_cleaned_regex = re.compile(
        'birth_name_cleaned_[0-9]'
    )

    birth_name_cleaned_cols = [s for s in col_list if birth_name_cleaned_regex.match(s)]

    # print(birth_name_cleaned_cols)

    # select the birth name_extracted columns from the column list
    birth_name_extracted_regex = re.compile('extracted')

    birth_name_extracted_cols = [s for s in col_list if len(birth_name_extracted_regex.findall(s)) > 0]

    # print(birth_name_extracted_cols)
    # iterate over the birth_name_extracted_column
    if len(birth_name_cleaned_cols) > 0:
        for birth_name_extracted in birth_name_extracted_cols:
            # print(birth_name_extracted)

            # correction = True

            for index, row in df.iterrows():

                # check if birth name extracted is present and not already in birth_name_cleaned column
                # split into two parts for performance reasons.
                if pd.isnull(row[birth_name_extracted]) is False:
                    if row[birth_name_extracted] not in row[birth_name_cleaned_cols].to_list():

                        # iterate over the birth_name_cleaned_columns to find an empty cell
                        # and fill it with 'birth_name_extracted'
                        for birth_name_cleaned_col in birth_name_cleaned_cols:

                            # if len(row[birth_name_cleaned_col]) == 0:
                            if pd.isnull(row[birth_name_cleaned_col]):
                                df.loc[index, birth_name_cleaned_col] = row[birth_name_extracted]
                                break

                            # elif birth_name_cleaned_col == birth_name_cleaned_cols[-1]:
                            #    correction = False

            # If all corrections were made delete the column 'birth_name_extracted'
            # if correction == True:
            df.drop([birth_name_extracted], axis=1, inplace=True)

    try:

        col_list = df.columns

        # filter the column names by two regex conditions to get two list for iteration
        birth_name_regex = re.compile('.*birth_name_cleaned')
        not_birth_name_regex = re.compile('^((?!(birth_name_cleaned|noble|qa)).)*$')

        birth_name_cols = [s for s in col_list if birth_name_regex.match(s)]
        name_cols = [s for s in col_list if not_birth_name_regex.match(s)]

        # function to compare birth name with name columns and delete the
        # birth-name if present in any other name column

        def name_comparison(x, y):

            return '' if x == y else x

        for bname in birth_name_cols:
            for name in name_cols:
                df[bname] = pd.Series(
                    list(
                        map(
                            name_comparison,
                            df[bname],
                            df[name]
                        )
                    ),
                    index=df.index
                )

    except:
        print('An error occurred during processing!')

    return df


# ---------------------------------------------------------------


def date_timing_check(df_t1, df_t2):
    """
    This function checks if the date in df_t1 is before or at the same date as
    the date in df_t2. If df_t2 is before df_t1 a newly created QA column is flagged.


    Parameters
    ----------
    df_t1 : pandas.Dataframe
        Dataframe containing 4 columns: year, month, day and qa
    df_t2 : pandas.Dataframe
        Dataframe containing 4 columns: year, month, day and qa

    Returns
    -------
    df : pandas.Dataframe
        Two column Dataframe containing the evaluation of the timing and a QA column.

    """

    df = pd.merge(
        df_t1,
        df_t2,
        left_index=True,
        right_index=True)

    # iterate through the rows of the newly merged dataframe
    for i, row in df.iterrows():
        try:
            # compare the year column of both input dfs
            if int(row[df.columns[0]]) < int(row[df.columns[4]]):
                df.loc[i, 'timing'] = 'consistent'
                continue

            elif int(row[df.columns[0]]) > int(row[df.columns[4]]):
                df.loc[i, 'timing'] = f'{df.columns[0]} > {df.columns[4]}'
                continue

            # if years are the same: Check the month
            else:

                if int(row[df.columns[1]]) < int(row[df.columns[5]]):
                    df.loc[i, 'timing'] = 'consistent'
                    continue

                elif int(row[df.columns[1]]) > int(row[df.columns[5]]):
                    df.loc[i, 'timing'] = f'{df.columns[1]} > {df.columns[5]}'
                    continue

                # if months are the same: Check the day
                else:

                    if int(row[df.columns[2]]) < int(row[df.columns[6]]):
                        df.loc[i, 'timing'] = 'consistent'
                        continue

                    elif int(row[df.columns[2]]) > int(row[df.columns[6]]):
                        df.loc[i, 'timing'] = f'{df.columns[2]} > {df.columns[6]}'
                        continue

                    else:
                        df.loc[i, 'timing'] = 'consistent'
                        continue
        except:
            df.loc[i, 'timing'] = 'consistent'

    # create a qa column based on if the 'timing' column's entry is "consistent"
    df['timing_qa'] = df['timing'].apply(
        lambda x: False if x == 'consistent' else True
    )

    return df[['timing', 'timing_qa']]


# ---------------------------------------------------------------
# Functions to apply on the whole dataframe
# ---------------------------------------------------------------

def entry_number_from_list(df):
    """return a running numbers for each indexing of a list grouped by the datestamp
    of the indexing and the document"""

    return df.groupby(['subject_data_filename', 'created_at']).cumcount() + 1


# ---------------------------------------------------------------

def general_cleaning_and_filtering(df):
    """ removes certain columns from the dataframe and removes corrupted data"""

    df = df[df['metadata_selection_state'] != 'failover_fallback']

    drop_list = [
        'user_name', 'user_id', 'user_ip', 'workflow_id', 'workflow_name', 'metadata_started_at',
        'metadata_finished_at','metadata_user_language', 'metadata_already_seen',
        'metadata_finished_workflow', 'metadata_retired', 'metadata_selected_at',
        'metadata_selection_state', 'metadata_user_has_finished_workflow', 'created_at',
        'gold_standard', 'expert']

    df.drop(drop_list, axis=1, inplace=True)

    # homogenise missing data
    df = df.where(pd.notnull(df), None)

    return df

# ---------------------------------------------------------------
# Functions for specific columns
# ---------------------------------------------------------------

# Date cleaning
# -------------------------------------------------------------------------------------


def day_swap(day: str, month: str):
    """
    This function checks if the value saved in the month column might rather be the day value and swaps it in case.

    :param day: Value from the day column of a date
    :param month: Value from the month column of a date
    :return: either month or day value for the day column
    """

    return (
        month if (32 > int(month) > 12) and (int(day) <= 12) else day
    ) if (
            bool(
                re.search(
                    r'[^0-9]+',
                    str(day) + str(month)
                )
            ) is False
    ) and (
            bool(
                re.search(
                    r'[0-9]+',
                    str(month)
                )
            )
    ) and (
            bool(
                re.search(
                    r'[0-9]+',
                    str(day)
                )
            )
    ) else day



def month_swap(day: str, month: str):
    """
    This function checks if the value saved in day might be the month value and swaps it in case.

    :param day: Value from the day column of a date
    :param month: Value from the month column of a date
    :return: either month or day value for the month value
    """

    return (
        day if (int(month) > 12) and (int(day) <= 12) else month
    ) if (
            bool(
                re.search(
                    r'[^0-9]+',
                    str(day) + str(month)
                )
            ) is False
    ) and (
            bool(
                re.search(
                    r'[0-9]+',
                    str(month)
                )
            )
    ) and (
            bool(
                re.search(
                    r'[0-9]+',
                    str(day)
                )
            )
    ) else month


# Standardise Nationality
# -------------------------------------------------------------------------------------

def find_matches(key, dictionary, string):
    """
    search a string for keys of a dictionary and return all keys
    """

    regex_pattern = r'\b' + re.escape(str(key)) + r'\b'

    if re.search(regex_pattern, string):
        return [key, dictionary[str(key)]]
    else:
        return ''


def result_checker(match_list):
    """
    The function checks if a matched string from nat_keys is a substring of another
    match and filters the list respectively.
    """

    filtered_matches = []

    first_element_list = [item[0] for item in match_list]

    for index, element in enumerate(first_element_list):

        pop_list = first_element_list.copy()
        pop_list.pop(index)

        if any(element in s for s in pop_list):
            continue
        else:
            filtered_matches.append(match_list[index])

    return filtered_matches


def standardizer(nat_keys: pd.Series, nat_dict: dict, raw_value: str):
    """
    The main function of the nationality standardisation.

    It takes the list of raw values (nat_keys) from the standardisation table,
    the standardisation table and a single raw value that needs to be standardised.
    For each raw value, the function runs a list comprehension through the nat_keys list
    to check if it could be a substring of the raw value that needs to be
    standardised.
    For the comparison the raw value, the nat_keys value and the dictionary are handed to
    the function find_matches().
    """

    match_list = [x for x in list(
        nat_keys.apply(
            lambda x: find_matches(
                x,
                nat_dict,
                raw_value
            )
        )
    ) if len(x) > 1]
    match_list.sort(key=lambda x: len(x[0]))
    matches = result_checker(match_list)

    return matches


def replace_raw_values(raw_value, matches):

    """
    replaces the raw value with a standardised value in case a standardised
    value is in matches

    """

    if len(matches) > 0:

        for match in matches:
            stand_value = raw_value.replace(match[0], match[1])

        return stand_value

    else:
        return raw_value


