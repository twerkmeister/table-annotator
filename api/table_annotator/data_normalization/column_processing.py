# -*- coding: utf-8 -*-
"""
This module contains functions to process different columns from workflows.
"""
from typing import Optional

# Import necessary packages
import pandas as pd
import numpy as np
import re
import table_annotator.data_normalization.regex_conditions as rc
import table_annotator.data_normalization.aux_functions as af



# ---------------------------------------------------------------
# Main Functions for column processing
# ---------------------------------------------------------------

def normalize_last_name(df,
                        last_name: str,
                        data_source: str,
                        birth_name_input=False,
                        alternative_spelling=False,
                        alias=False,
                        flag_noble_prefix=True):

    # basic cleaning of the column and returning it as a pandas series
    name_col = af.clean_copy(df, last_name)

    # Converting the last names to lower case:
    name_col = name_col.str.lower()

    # Removing Academic titles from the last name:
    name_col = name_col.replace(
        to_replace=rc.academic_title_regex,
        value='',
        regex=True)

    # remove certain keywords that might be in the last name column but are unwanted suffix or prefix
    name_col = af.keyword_removal(name_col)

    # process noble_name

    # create a column containing the noble prefix, if no prefix matched: Nan
    noble_prefix = name_col.str.lower().str.extract(
        rc.noble_name_regex,
        expand=False)[0]

    # clean the noble prefix from every special character except space
    noble_prefix = noble_prefix.replace(
        rc.noble_prefix_clean_regex,
        ' ',
        regex=True)

    # remove the noble prefix from the last name
    # No longer needed, the noble name is treated in place
    # name_col = name_col.str.lower().replace(to_replace=rc.noble_name_regex, value='', regex=True)

    # Flag as QA if noble prefix is present
    if flag_noble_prefix:
        noble_qa = noble_prefix.apply(
            lambda x: True if pd.isnull(x) is False else False)
    else:
        noble_qa = False

    # create birth_name column
    if birth_name_input is False:
        # extract a birth-name if as defined in 'birth_name_regex'
        birth_name_col = name_col.str.lower().str.extract(
            rc.birth_name_regex,
            expand=False
        )[0].replace(
            to_replace=rc.birth_name_clean_regex,
            value='',
            regex=True
        )

        birth_name_col.fillna(
            '',
            inplace=True
        )

        # If only the birth name keyword is present it is writen into the birth name column. Next line removes it:
        birth_name_col = birth_name_col.replace(
            to_replace=rc.birth_name_regex,
            value='',
            regex=True
        ).str.title()

        # remove birthname and indicating regex phrase from name column
        name_col = name_col.replace(
            to_replace=rc.birth_name_regex,
            value='',
            regex=True
        )

    # strip column of all ; at beginning and end of string.
    name_col = name_col.str.replace(
        rc.strip_semicolon_regex,
        '',
        regex=True
    )

    # Change all ';' to whitespace in case there are ';' separating the noble prefix from the last name
    # The process is reversed for all whitespaces not associated with the noble prefix in the subsequent line.
    name_col = name_col.str.strip().replace(
        to_replace=';',
        value=' ',
        regex=True
    )

    # change separating character to semicolon for splitting
    name_col = name_col.str.strip().replace(
        to_replace=rc.name_semicolon_transformation_regex,
        value=';',
        regex=True
    )

    # double check that there are never more than two separators:
    name_col = name_col.str.strip().replace(
        to_replace=r';{2,}',
        value=';',
        regex=True)

    # create a QA column

    # create QA columns for birth name and the name column
    qa_col_name_col = af.create_qa_col(
        name_col,
        rc.qa_regex,
        rc.qa_no_entry_regex)

    # birth name:
    if birth_name_input is False:
        qa_col_birth_name_col = birth_name_col.str.contains(rc.qa_regex)

        # compare the two QA columns as well as the noble prefix qa and get a single QA column
        qa_col = qa_col_name_col | qa_col_birth_name_col | noble_qa

    else:
        # Compare only the noble prefix and name qa
        qa_col = qa_col_name_col | noble_qa

    # Split the name column into maximum 5 names and name them properly:
    name_col = name_col.str.title()
    name_df = name_col.str.split(pat=';', n=4, expand=True)

    # Account for the different naming options:

    if birth_name_input:
        col_name = 'birth_name'
    elif alias:
        col_name = 'last_name_alias'
    else:
        col_name = 'last_name'
    # Rename the columns generated by the split
    rename_dict = {}
    for element in name_df.columns:
        if alternative_spelling:
            rename_dict[element] = f'alternative_spellings_of_{col_name}_cleaned_{str(element + 1)}'
        else:
            rename_dict[element] = f'{col_name}_cleaned_{str(element + 1)}'
    name_df.rename(columns=rename_dict, inplace=True)

    # check the name columns if character length is below 50, if longer flag in QA column
    for column in name_df.columns[:-1]:
        col_length_check = name_df[column].str.len() > 49
        qa_col = col_length_check | qa_col

    # remove any digits from the name columns
    name_df = name_df.replace(to_replace=r'[0-9]', value='', regex=True)

    # Append other columns to the dataframe
    if alternative_spelling:
        # name_df[f'alternative_spellings_of_{col_name}_cleaned_1'] =  noble_prefix.fillna('').astype(str) +' '+ name_df[f'alternative_spellings_of_{col_name}_cleaned_1'].fillna('').astype(str)
        # name_df[f'alternative_spellings_of_{col_name}_noble_prefix'] = noble_prefix
        name_df[f'alternative_spellings_of_{col_name}_qa'] = qa_col
    else:
        if birth_name_input is False:
            name_df[f'{col_name}_birth_name_extracted'] = birth_name_col
        # name_df[f'{col_name}_cleaned_1'] =  noble_prefix.fillna('').astype(str) +' '+ name_df[f'{col_name}_cleaned_1'].fillna('').astype(str)
        # name_df[f'{col_name}_noble_prefix'] = noble_prefix
        name_df[f'{col_name}_qa'] = qa_col

    # trim whitespace in dataframe except for boolean QA column
    for column in name_df.columns[:-1]:
        name_df[column] = name_df[column].str.strip()

    name_df[f'{col_name}_data_source'] = data_source

    return name_df


# ---------------------------------------------------------------

def normalize_first_name(df,
                         first_name: str,
                         data_source: str,
                         alternative_spelling=False,
                         alias=False):

    # basic cleaning of the column and returning it as a pandas series
    name_col = af.clean_copy(df, first_name)

    # Converting the last names to propper case:
    name_col = name_col.str.title()

    # Removing Academic titles from the first name:
    name_col = name_col.replace(
        to_replace=rc.academic_title_regex,
        value='',
        regex=True
    )

    # remove certain keywords that might be in the last name column but are unwanted suffix or prefix

    name_col = af.keyword_removal(name_col)

    # remove noble_name

    # create a column containing the noble prefix, if no prefix matched: Nan
    noble_prefix = name_col.str.lower().str.extract(
        rc.noble_name_regex,
        expand=False
    )[0]

    # remove the noble prefix from the first name
    name_col = name_col.str.lower().replace(
        to_replace=rc.noble_name_regex,
        value='',
        regex=True)

    # Flag as QA if noble prefix is present
    noble_qa = noble_prefix.apply(
        lambda x: True if pd.isnull(x) is False else False
    )

    # change separating character to semicolon for splitting
    name_col = name_col.str.strip().replace(
        to_replace=rc.semicolon_transformation_regex,
        value=';',
        regex=True
    )

    # create a QA column

    # create QA columns for the name column
    qa_col = af.create_qa_col(
        name_col,
        rc.qa_regex,
        rc.qa_no_entry_regex
    )

    # merge the qa flags from the name column and the noble name
    qa_col = qa_col | noble_qa

    # Split the name column into maximum 5 names and name them properly:
    name_col = name_col.str.title()
    name_df = name_col.str.split(
        pat=';',
        n=4,
        expand=True
    )

    # set the column name

    if alias:
        col_name = 'first_name_alias'
    else:
        col_name = 'first_name'

    # Rename the columns generated by the split
    rename_dict = {}
    for element in name_df.columns:
        if alternative_spelling == True:
            rename_dict[element] = f'alternative_spellings_of_{col_name}_cleaned_{str(element + 1)}'

        else:
            rename_dict[element] = f'{col_name}_cleaned_{str(element + 1)}'

    name_df.rename(columns=rename_dict, inplace=True)

    # check the name columns if character length is below 50, if longer flag in QA column
    for column in name_df.columns[:-1]:
        col_length_check = name_df[column].str.len() > 49
        qa_col = col_length_check | qa_col

    # Append other columns to the dataframe
    if alternative_spelling == True:
        name_df[f'alternative_spellings_of_{col_name}_qa'] = qa_col

    else:
        name_df[f'{col_name}_qa'] = qa_col

    # Final polishing:
    for column in name_df.columns[:-1]:
        # trim whitespace in dataframe except for boolean QA column
        name_df[column] = name_df[column].str.strip()
        # Check if first name is a single digit. if yes add a '.'
        name_df[column] = name_df[column].apply(
            lambda x: x + '.' if len(str(x)) == 1 else x
        )

    name_df[f'{col_name}_data_source'] = data_source

    return name_df


# ---------------------------------------------------------------

def normalise_prisoner_number(df,
                              prisoner_no: str,
                              data_source: str):
    """
    Function normalising the prisoner number with up to 5 different prisoner
    numbers. Characters are removed from the numbers and for special characters
    'A B R Z' are stored in separate columns referenced to the numeric column

    Parameters
    ----------
    df : pandas.DataFrame
        Dataframe containing the prisoner number column.
    prisoner_no : str
        Prisoner column name.

    Returns
    -------
    prisoner_no_df : pandas.DataFrame
        Normalised prisoner number columns and associated character columns.

    """

    # basic cleaning of the column and returning it as a pandas series
    prisoner_no_col = af.clean_copy(df, prisoner_no)

    # create a qa column for the prisoner number
    qa_col_prisoner_no = af.create_qa_col(
        prisoner_no_col,
        rc.qa_prisoner_no_regex,
        rc.qa_prisoner_no_no_entry_regex)

    # remove character strings longer than 1
    prisoner_no_col = prisoner_no_col.str.strip().replace(
        to_replace=r'\b[a-zA-z]{2,}\b',
        value='',
        regex=True)

    # remove double withe-space
    prisoner_no_col = prisoner_no_col.replace(
        to_replace='  ',
        value=' ',
        regex=True)

    # remove whitespace between digit/character and special character
    prisoner_no_col = prisoner_no_col.replace(
        to_replace=r'(?<=[^0-9a-zA-Z])\s(?=[0-9])|(?<=[a-zA-Z])\s(?=[^0-9a-zA-Z])',
        value='',
        regex=True
    )

    # check for a space in potential 5 digits numbers after the second digit and remove it
    prisoner_no_col = prisoner_no_col.replace(
        to_replace=r'(?<=[0-9]{2})\s(?=[0-9]{3})',
        value='',
        regex=True
    )

    # remove the separator between a single character and a number
    prisoner_no_col = prisoner_no_col.str.strip().replace(
        to_replace=rc.find_prisoner_number_character_separator_regex,
        value='',
        regex=True
    )

    # change separating character to semicolon for splitting
    prisoner_no_col = prisoner_no_col.str.strip().replace(
        to_replace=rc.semicolon_transformation_regex,
        value=';',
        regex=True
    )

    # Sort the prisoner numbers in a single row by numeric value
    prisoner_no_col = af.sort_list_in_column(prisoner_no_col)

    # Split the name column into maximum 5 names and name them properly:
    prisoner_no_df = prisoner_no_col.str.split(
        pat=';',
        n=4,
        expand=True
    )

    rename_dict = {}
    for element in prisoner_no_df.columns:
        rename_dict[element] = f'prisoner_number_trim_{str(element + 1)}'

    prisoner_no_df.rename(columns=rename_dict, inplace=True)

    # Remove separating dots inside the prisoner number:
    prisoner_no_df.replace(
        r'((?<=\b\d{1})|(?<=[^\d]\d{1})|(?<=\b\d{2})|(?<=[^\d]\d{2})|(?<=\b\d{3})|(?<=[^\d]\d{3}))[.](?=\d{3})',
        '',
        inplace=True,
        regex=True
    )

    # Extract valid Prisoner number characters and create additional columns for them:
    prisoner_character_regex = r'(\b[aAbBrRzZ](?=[^a-zA-Z])+)'
    qa_regex = r'[^0-9]'
    qa_no_entry_regex = r'^-$|nan|None'

    for element in prisoner_no_df.columns:

        prisoner_no_char = prisoner_no_df[element].str.extract(
            prisoner_character_regex,
            expand=False
        )

        prisoner_no_char = prisoner_no_char.apply(
            lambda x: x if len(str(x)) == 1 else ''
        )

        prisoner_no_df[f'{element}_additional_information'] = prisoner_no_char

        # if successfully extracted, remove character from original column
        for index, row in prisoner_no_df.iterrows():
            if len(row[f'{element}_additional_information']) == 1:
                prisoner_no_df.loc[index, element] = re.sub(
                    prisoner_character_regex,
                    "",
                    row[element]
                )

        # After character is removed, check with qa for anything that is not numeric:
        qa_temp = af.create_qa_col(
            prisoner_no_df[element],
            qa_regex,
            qa_no_entry_regex)

        qa_col_prisoner_no = qa_temp | qa_col_prisoner_no

    # convert all columns to string
    prisoner_no_df.fillna('', inplace=True)
    prisoner_no_df = prisoner_no_df.applymap(str)

    prisoner_no_df['prisoner_number_qa'] = qa_col_prisoner_no
    prisoner_no_df['prisoner_number_data_source'] = data_source

    return prisoner_no_df


# ---------------------------------------------------------------

def normalise_date(df,
                   date_col_name: str,
                   date_output_name: str,
                   data_source: str,
                   timespan: list):
    """
    This function takes a one column date and normalises it into year, month
    and day. Processing includes checking for swaps of day and month, replacing
    characters in the month columns and a date validity check.

    Parameters
    ----------
    df : pandas.DataFrame
        Dataframe containing the date column
    date_col_name : str
        name of the input date column
    date_output_name : str
        name of the output column
    data_source : str
        name of the data source
    timespan : list
        two four digit integers to set the upper and lower boundaries of the date range


    Returns
    -------
    dob_df : pandas.DataFrame
        Dataframe containing the year, month and day as well as a QA column.

    """

    # basic cleaning of the column and returning it as a pandas series
    date_col = af.clean_copy(df, date_col_name)
    date_col = date_col.apply(str)

    # Check for question marks in the column
    qa_no_entry_regex = r'^-$|nan'
    qa_col = pd.Series(
        af.create_qa_col(date_col,
                      r'\?',
                      qa_no_entry_regex
                      )
    )

    # complete dates where only the year is given as -.-.Year
    date_col = date_col.apply(
        lambda x: '0.0.' + str(x) if bool(
            re.match(
                rc.digit_4_year_regex,
                str(x)
            )
        ) is True else x
    )

    # reformat dates in case of 8 digits present in case that separators were not given
    date_col = date_col.apply(
        lambda x: af.date_integer_separator(x) if (
                len(
                    re.sub(
                        '[^0-9]',
                        '',
                        str(x)
                    )
                ) == 8
        ) else x)

    # change separating character to semicolon for splitting
    date_col = date_col.str.strip().replace(
        to_replace=rc.name_semicolon_transformation_regex,
        value=';',
        regex=True
    )

    # double check that there are never more than two separators:
    date_col = date_col.str.strip().replace(
        to_replace=r';{2,}',
        value=';',
        regex=True
    )

    # remove age if given in a format similar to 'xx yrs.' or similar
    age_regex = r'(y|j|J).*|age'
    date_col = date_col.apply(
        lambda x: '' if bool(
            re.search(
                age_regex,
                x)
        ) is True else x
    )

    # change separating character to dot for splitting

    date_col = date_col.str.strip().replace(
        to_replace=rc.date_split_regex,
        value='.',
        regex=True
    )

    # Split the column into day month and year:
    date_df = date_col.str.split(
        pat='.',
        n=2,
        expand=True
    )
    date_df.rename(
        columns={0: 'Day', 1: 'Month', 2: 'Year'},
        inplace=True
    )

    # trim whitespace in df
    for column in date_df.columns:
        date_df[column] = date_df[column].str.strip()

    # replace - with
    date_df.fillna(
        '',
        inplace=True
    )
    date_df.replace(
        to_replace=r'^-+$',
        value='',
        regex=True,
        inplace=True
    )
    date_df.replace(
        to_replace=r'[^0-9]',
        value='',
        regex=True,
        inplace=True
    )

    # replace questionmarks in the dob_df
    replace_qm_regex = r'^\?+$'
    date_df.replace(
        to_replace=replace_qm_regex,
        value='',
        regex=True,
        inplace=True
    )

    # corrct the year digits if only two digits were given
    # !!! This is only valid for date of birth and not date of death !!!!
    year = date_df['Year'].apply(
        lambda x: (
            '18' + x if int(x) >= 50 else '19' + x
        ) if (len(str(x)) == 2) and bool(
            re.search(r'[^0-9]', x)
        ) is False else x
    )

    # add a zero to the beginning of the day and month if necessary: 3 -> 03
    day = date_df['Day'].apply(
        lambda x: '0' + x if (len(str(x)) == 1) and bool(
            re.match(r'[0-9]', x)
        ) else x
    )

    month = date_df['Month'].apply(
        lambda x: '0' + x if (len(str(x)) == 1) and bool(
            re.match(r'[0-9]', x)
        ) else x
    )

    # remove double zeros, respectively invalid date entries from day and month

    day = day.str.strip().replace(
        to_replace=rc.no_double_zeros_md_regex,
        value='',
        regex=True
    )
    month = month.str.strip().replace(
        to_replace=rc.no_double_zeros_md_regex,
        value='',
        regex=True)
    # the same for year only with 4 characters to stop before

    year_corrected = year.str.strip().replace(
        to_replace=rc.no_double_zeros_y_regex,
        value='',
        regex=True)

    # Check for swaps of month and day


    day_corrected = pd.Series(
        list(
            map(
                af.day_swap,
                day,
                month
            )
        ),
        index=day.index
    )

    month_corrected = pd.Series(
        list(
            map(
                af.month_swap,
                day,
                month)
        ),
        index=month.index
    )

    # replace character written month with the corresponding numeric month

    for m in rc.month_cor_list_reg:
        month_corrected = month_corrected.str.lower().replace(
            to_replace=m[0],
            value=m[1],
            regex=True
        )

        # create a dataframe for with the corrected year, month and day columns:
    date_df = pd.DataFrame(
        {f'{date_output_name}_year_cleaned': year_corrected,
         f'{date_output_name}_month_cleaned': month_corrected,
         f'{date_output_name}_day_cleaned': day_corrected}
    )

    # check if values are numeric and within expected range:
    qa_day = af.date_validity_check(
        date_df[f'{date_output_name}_day_cleaned'],
        31,
        0
    )
    qa_month = af.date_validity_check(
        date_df[f'{date_output_name}_month_cleaned'],
        12,
        0
    )
    qa_year = af.date_validity_check(
        date_df[f'{date_output_name}_year_cleaned'],
        timespan[1],
        timespan[0]
    )

    qa_col = qa_col | qa_day | qa_month | qa_year

    # replace all empty string fields with None, otherwise the following function
    # does not work
    date_df = date_df.replace(r'^\s*$',
                              np.nan,
                              regex=True
                              )

    # check if all three date fields are completely filled or empty. If only
    # partially filled flag for qa
    is_null_df = date_df.isnull()

    complete_date_qa = (
        is_null_df[f'{date_output_name}_day_cleaned'] == is_null_df[f'{date_output_name}_month_cleaned']
    ) & (
        is_null_df[f'{date_output_name}_day_cleaned'] == is_null_df[f'{date_output_name}_year_cleaned']
    ) & (
        is_null_df[f'{date_output_name}_year_cleaned'] == is_null_df[f'{date_output_name}_month_cleaned']
    )

    qa_col = qa_col | ~complete_date_qa

    date_df[f'{date_output_name}_qa'] = qa_col
    date_df[f'{date_output_name}_data_source'] = data_source

    # replace nan used for qa again with empty strings
    date_df.fillna('', inplace=True)

    # remove digit strings that are too long to be stored in int64 in bigquery
    date_df = date_df.replace(
        to_replace=r'[0-9]{10,}',
        value='',
        regex=True
    )

    return date_df


# ---------------------------------------------------------------

def normalise_dob(df,
                  dob: str,
                  data_source: str):

    """The function normalise_dob() is deprecated. Please use normalise_date()!

    This function takes a one column date and normalises it into year, month
    and day. Processing includes checking for swaps of day and month, replacing
    characters in the month columns and a date validity check.

    Parameters
    ----------
    df : pandas.DataFrame
        Dataframe containing the date column
    dob : str
        name of the date column.
    data_source : str
        source of the data.

    Returns
    -------
    dob_df : pandas.DataFrame
        Dataframe containing the year, month and day as well as a QA column.
    """

    print('The function normalise_dob() is deprecated. Please use normalise_date()!')

    return normalise_date(df,
                          dob,
                          'date_of_birth',
                          data_source,
                          [1850, 1950]
                          )


# ---------------------------------------------------------------

def clean_date(df,
               date_col_list: list,
               output_name: str,
               data_source: str,
               timespan: list = [1850, 1950],
               dropdown: bool = True):
    """
    Function to clean up a date separated in three separated columns: year,
    month and day.
    The columns were filled via a dropdown menu selection mask so that there
    is no need to check for
    non-date characters.

    Parameters
    ----------
    df : pandas.DataFrame
        Dataframe containing the date of birth columns
    date_col_list : list
        string names of year, month and day columns in df
    output_name : str
        name of the output column
    data_source : str
        source of the data.
    timespan : list
        a list with two integer objects, timespan[0] < timespan[1].
        they are the boundaries of what timespan is acceptable for the date to clean
    dropdown : bool
        if True, the date columns  are expected to be well formatted


    Returns
    -------
    dob_df : pandas.DataFrame
        Dataframe containing the cleand up year, month and day as well as a QA
        column.

    """

    # create qa column and set to true if cell value == 'unclear' selected from the dropdown menu
    qa_col = pd.Series()

    # if dropdown selection is 'unclear' mark for QA
    birthdate_regex = r'unclear'
    for column in date_col_list:
        qa_temp = af.create_qa_col(
            df[column],
            birthdate_regex,
            rc.qa_no_entry_regex
        )
        qa_col = qa_temp | qa_col

        # print(qa_col.value_counts())

    year = df[date_col_list[2]].fillna('').astype(str)
    month = df[date_col_list[1]].fillna('').astype(str)
    day = df[date_col_list[0]].fillna('').astype(str)

    # remove month name from month column
    if dropdown:
        month = df[date_col_list[1]].fillna('').apply(
            lambda x: x[0:2] if (
                    bool(
                        re.match(
                            r'[0-9]',
                            x
                        )
                    )
            ) else x
        )

    else:
        # replace month names with the respective integer
        for m in rc.month_cor_list_reg:
            month = month.str.lower().replace(
                m[0],
                m[1],
                regex=True
            )
        # print(month)
        # add a zero to the beginning of the day and month if necessary: 3 -> 03
        day.replace(
            to_replace=r'(\.0)',
            value='',
            regex=True,
            inplace=True
        )

        day = day.apply(
            lambda x: '0' + x if (len(str(x)) == 1) and bool(
                re.match(
                    r'[0-9]',
                    x
                )
            ) else x
        )

        month = month.apply(
            lambda x: '0' + x if (len(str(x)) == 1) and bool(
                re.match(
                    r'[0-9]',
                    x
                )
            ) else x
        )


    date_df = pd.DataFrame(
        {f'{output_name}_year_cleaned': year.astype(str).str.strip(),
         f'{output_name}_month_cleaned': month.astype(str).str.strip(),
         f'{output_name}_day_cleaned': day.astype(str).str.strip()}
    )

    date_df.replace(
        to_replace=r'(\.0)',
        value='',
        regex=True,
        inplace=True
    )


    date_df.replace(
        to_replace=r'[-]',
        value='00',
        regex=True,
        inplace=True
    )
    date_df.replace(
        to_replace=r'[^0-9]',
        value='',
        regex=True,
        inplace=True
    )

    if dropdown is False:
        # corrct the year digits if only two digits were given
        # !!! This is only valid for date of birth and not date of death !!!!
        date_df[f'{output_name}_year_cleaned'] = date_df[f'{output_name}_year_cleaned'].apply(
            lambda x: (
                '18' + x if int(x) >= 50 else '19' + x
            ) if (len(str(x)) == 2) and bool(
                re.search(
                    r'[^0-9]',
                    x)
            ) is False else x
        )

        # add a zero to the beginning of the day and month if necessary: 3 -> 03
        date_df[f'{output_name}_day_cleaned'] = date_df[f'{output_name}_day_cleaned'].apply(
            lambda x: '0' + x if (len(str(x)) == 1) and bool(
                re.match(r'[0-9]', x)
            ) else x
        )
        date_df[f'{output_name}_month_cleaned'] = date_df[f'{output_name}_month_cleaned'].apply(
            lambda x: '0' + x if (len(str(x)) == 1) and bool(
                re.match(r'[0-9]', x)
            )else x
        )

    # check date validity:
    qa_day = af.date_validity_check(
        date_df[f'{output_name}_day_cleaned'],
        31,
        0
    )
    qa_month = af.date_validity_check(
        date_df[f'{output_name}_month_cleaned'],
        12,
        0
    )
    qa_year = af.date_validity_check(
        date_df[f'{output_name}_year_cleaned'],
        timespan[1],
        timespan[0]
    )
    qa_col = qa_col | qa_day | qa_month | qa_year

    # remove '00' if no complete year is given in the respective row

    def date_temp_func(year, target):

        return target if len(str(year)) == 4 else ''


    for column in date_df.columns.to_list():
        date_df[column] = pd.Series(
            list(
                map(
                    date_temp_func,
                    date_df[f'{output_name}_year_cleaned'],
                    date_df[column])
            ),
            index=date_df.index)

    # check if all three date fields are completely filled or empty. If only
    # partially filled flag for qa
    is_null_df = date_df.isnull()[
        [f'{output_name}_day_cleaned',
         f'{output_name}_month_cleaned',
         f'{output_name}_year_cleaned']
    ]
    complete_date_qa = (
        is_null_df[f'{output_name}_day_cleaned'] == is_null_df[f'{output_name}_month_cleaned']
    ) & (
        is_null_df[f'{output_name}_day_cleaned'] == is_null_df[f'{output_name}_year_cleaned']
    ) & (
        is_null_df[f'{output_name}_year_cleaned'] == is_null_df[f'{output_name}_month_cleaned']
    )

    qa_col = qa_col | ~complete_date_qa
    # print(qa_col.value_counts())

    # return df with cleaned year, month and day column
    date_df[f'{output_name}_qa'] = qa_col

    # Replace '-' with an empty string.
    date_df.replace(
        to_replace='-',
        value='',
        inplace=True
    )

    date_df[f'{output_name}_data_source'] = data_source

    return date_df


# ---------------------------------------------------------------

def clean_birthdate(df, dob_col_list: list, data_source: str):
    """

    This function is deprecated. Please use "clean_date()".

    Function to clean up a date separated in three separated columns: year,
    month and day.
    The columns were filled via a dropdown menu selection mask so that there
    is no need to check for
    non-date characters.

    Parameters
    ----------
    df : pandas.DataFrame
        Dataframe containing the date of birth columns
    dob_col_list : list
        string names of year, month and day columns in df
    data_source : str
        source of the data.

    Returns
    -------
    dob_df : pandas.DataFrame
        Dataframe containing the cleand up year, month and day as well as a QA
        column.

    """

    print('This function is deprecated. Please use "clean_date()".')

    return clean_date(df,
                      dob_col_list,
                      'date_of_birth',
                      data_source=data_source,
                      timespan=[1850, 1949]
                      )


# ---------------------------------------------------------------

def date_correction(df,
                    date_col: str,
                    output_name: str,
                    data_source: str,
                    date_df
                    ):
    """
    This function normalises a date correction if present in the dataset and
    compares it to the original date that was entered. If the dates are the same,
    the corrected date will be dismissed.

    Parameters
    ----------
    df : pandas.DataFrame
        Dataframe containing the date of birth corrections column.
    date_col : str
        Name of the date of birth corrections column within df.
    date_df : pandas.DataFrame
        Dataframe containing the cleaned date output from the function "clean_birthdate".

    Returns
    -------
    output_df : pandas.DataFrame
        Dataframe containing the input dob_df and the newly created normalised
        date correction with an additional QA column.

    """

    # normalise the corrected date
    print('The normalise_date() function has started.')
    date_corrections = normalise_date(
        df,
        date_col,
        output_name,
        data_source
    )
    print('The date was normalised.')

    date_df_columns = date_df.columns
    # compare original and corrected birthdate
    orig_date = date_df.fillna(value='')[[
        date_df_columns[0],
        date_df_columns[1],
        date_df_columns[2]
    ]].astype(str).agg('.'.join, axis=1)

    corr_date = date_corrections.fillna(value='')[[
        f'{output_name}_year_cleaned',
        f'{output_name}_month_cleaned',
        f'{output_name}_day_cleaned'
    ]].astype(str).agg('.'.join, axis=1)

    comparison_column = np.where(
        orig_date == corr_date,
        True,
        False
    )

    print('Original and corrected date are compared.')

    comp_df = pd.concat([date_corrections,
                         pd.Series(
                             comparison_column,
                             index=date_corrections.index,
                             name='comp')
                         ],
                        axis=1
                        )

    comp_df.drop(
        comp_df[comp_df['comp'] is True].index,
        inplace=True
    )

    comp_df.drop(
        ['comp'],
        axis=1,
        inplace=True
    )

    print('The export dataframe is being created.')

    output_df = date_df.join(comp_df)
    output_df[f'{output_name}_qa'] = date_corrections[f'{output_name}_qa']
    output_df[f'{output_name}_data_source'] = data_source

    return output_df

# ---------------------------------------------------------------

def clean_place_of_imprisonment(df, poi_col: str):
    """
    This function cleans the place of imprisonment column comming from a dropdown menu.
    Abbreviations are removed and a QA column is created for uncertain entries.

    Parameters
    ----------
    df : pandas.DataFrame
        Dataframe containing the 'place of imprisonment' column.
    poi_col : str
        Name of the 'place of imprisonment' column.

    Returns
    -------
    poi_df : pandas.DataFrame
        Output dataframe containing the cleaned 'place of imprisonment' and
        a QA column.

    """

    col = df[poi_col]

    # create qa column from string values 'Unklar and 'Unclear
    poi_regex = r'Unclear|Unklar'

    qa_col = af.create_qa_col(
        col,
        poi_regex,
        rc.qa_no_entry_regex
    )

    # remove abbreviations after the main string
    clean_col = pd.Series(
        [x[0] for x in col.str.split()],
        index=col.index
    )

    poi_df = pd.DataFrame(
        {'place_of_imprisonment': clean_col,
         'place_of_imprisonment_qa': qa_col}
    )

    return poi_df


# -------------------------------------------------------------------------
# NATIONALITY
# -------------------------------------------------------------------------

def standardize_nationality(df: pd.DataFrame,
                            nat_column: str,
                            path: str,
                            nat_dict_table: str,
                            unclear_table: str):

    """
    Function to standardise a nationality column by using a dictionary handend
    to the function.

    """


    # read the tables used for standardisation and format them
    nat_dict_df = pd.read_excel(path + nat_dict_table)
    unclear_df = pd.read_excel(path + unclear_table)

    nat_dict = pd.Series(nat_dict_df.std_merged.values, index=nat_dict_df.raw).to_dict()
    unclear_dict = pd.Series(unclear_df.std_merged.values, index=unclear_df.raw).to_dict()

    nat_keys = pd.Series(list(nat_dict.keys()))

    nat_col = df[nat_column]
    nat_df = pd.DataFrame(nat_col)
    key_list = nat_dict.keys()
    nat_keys = pd.Series(key_list)
    value_list = list(nat_dict.values())
    unclear_key_list = list(unclear_dict.keys())
    unclear_value_list = list(unclear_dict.values())
    semicolon_transformation_regex = r'(\s;|;\s|\s|\,|\-|;+|\\|/)+'

    # preprocess the nationality column
    nat_col.fillna('', inplace=True)
    nat_col.replace('\.', '', inplace=True, regex=True)

    # find standardised values
    matches = nat_col.progress_apply(
        lambda x: af.standardizer(
            nat_keys,
            nat_dict,
            str(x)
        )
    )

    # replace raw values
    replaced_values = pd.Series(
        list(
            map(
                af.replace_raw_values,
                nat_col,
                matches)
        ), index=nat_col.index
    )

    replaced_values = replaced_values.str.strip().replace(
        to_replace=semicolon_transformation_regex,
        value=';',
        regex=True
    )
    # separate multiple nationality entries
    nat_df = replaced_values.str.split(
        pat=';',
        n=4,
        expand=True
    )

    for n, column in enumerate(nat_df):
        nat_df.rename(
            columns={n: f'nationality_{str(n + 1)}'},
            inplace=True
        )

    # Create QA column for the dataframe
    nat_df_cols = nat_df.columns.to_list()

    for index, row in nat_df.iterrows():

        print(index, end='\r')
        qa_row = False
        for n, column in enumerate(nat_df_cols):

            if pd.isnull(row[column]) == True:
                qa_temp = False

            elif row[column] in key_list:
                nat_df.loc[index, f'{column}_standardized'] = nat_dict[row[column]]
                qa_temp = False

            elif row[column] in value_list:
                nat_df.loc[index, f'{column}_standardized'] = row[column]
                qa_temp = False

            elif row[column] in unclear_key_list:
                nat_df.loc[index, f'{column}_standardized'] = '?'
                qa_temp = True

            elif row[column] in unclear_value_list:
                nat_df.loc[index, f'{column}_standardized'] = '?'
                qa_temp = True


            else:
                nat_df.loc[index, f'{column}_standardized'] = row[column]
                qa_temp = True

            qa_row = qa_temp | qa_row
            # print('one column: ',index, qa_row)
        # print('full row: ',index, qa_row)
        nat_df.loc[index, 'nationality_standardized_qa'] = qa_row

    nat_df['nationality_quality_level'] = nat_df['nationality_standardized_qa'].apply(
        lambda x: 'Rohdaten' if x is True else 'technisch standardisiert'
    )

    return nat_df

def resolve_number_shortening(df: pd.DataFrame, column: str,
                              output_column, starting_number: Optional[str] = None
                              ) -> pd.DataFrame:
    """Resolve number shortening in the given column of the dataframe.

    e.g.
    1010   -> 1010
       1   -> 1011
       2   -> 1012
       3   -> 1013
       4   -> 1014
    ....
    """
    resolved_numbers = []
    for number in df[column]:
        if starting_number is None or len(number) >= len(starting_number):
            resolved_numbers.append(number)
            starting_number = number
        else:
            resolved_number = starting_number[:-len(number)] + number
            resolved_numbers.append(resolved_number)

    df[output_column] = resolved_numbers
    return df

