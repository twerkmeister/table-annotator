# -*- coding: utf-8 -*-
"""
Created on Wed Dec  8 11:26:30 2021

@author: awellhaeuser

This file contains regex conditions for the column processing
"""

dash_words = r'(?i)\bblank\b|\b\[blank\]\b|\b\(blank\)\b|\bblanc\b|\bnone\b|\bleer\b|nicht bekannt|\bk\.+\s*a\b\.*|\bk\.*\s*a\b\.+|\bnn\b|\bfehlt\b|\bempty\b|\bmissing\b|\bna\b|\bNA\b|\bNa\b|\bnot\b|unklear|keine angabe|entfällt|unavailable|not listet|not statet|no information|\bno\b|nr\. unbekannt|nicht angegeben|keine nummer|unknown|unbekant|\bnil\b|no data|xxx|unbekannt\b|\bkeine\b|\bohne\b|_|^0+$'
deleted_words = r'(?i)lined out|crossed out|durchgestrichen|gestrichen|scored out|\[strikethrough\]|"+'
question_mark_words = r'(?i)illegible|unclear|unsure|not clear|unreadable|unklar|nicht erkennbar|nicht lesbar|\?+|unlesbar|unleserlich|ungenau'  # ^\.+|\.+$|^\*+|\*+$|^\++|\++$
semicolon_words = r'(?i),|\bor\b|\boder\b|\band\b|\bund\b|/|\(|\)|:|\[|\]'

key_words_regex = r'\b(mr\.|mrs\.|frau|fr\.\s|herr|herrn|frl\.|ing\.|tote|toter|died|neugeborenes|unbekannter\stoter|unbekannte\stote|auch|vel|freifrau|prinz|prinzessin|erbprinz|freiherr|freifr|reichsgraf|reichsgräfin|graf|gräfin|freiin|säugling|kind|wwe\.|gefr\.|soldat|baron|baronin|hr\.|ehefrau|vel|alias|baby|wwe|schwester|wife|gattin|gatte|or|oder|od\.\s|jude|jüdin|bruder|heil|hitler)(\s|\b)'

academic_title_regex = r'\b(Dr\.|Prof\.|Mudr\.)'

noble_name_regex = r'\b(?![a-z]\')(van(([^a-zA-Z]+(der|den|de|d\.))|\.)?|von(([^a-zA-Z]+(der|den|de|d\.))|\.)?|de la|del|di|der|den|vom|dal|della|dell|dalla|da|d|(v\.\s?d\.)|v\.|von\.|d\.|du|de|le|la|v|d|mc|ter|ten|te|san)(\b|\s)(?=[a-zA-Z]){2,}'
noble_prefix_clean_regex = r'[^a-zA-Z]'

birth_name_regex = r'((\b)(geborene|geb\.|geb|geboren|nee|née|nèe|zd\.|zd)(\b).*)'
birth_name_clean_regex = r'((\b)(geborene|geb\.|geb|geboren|nee|née|nèe|zd\.|zd)(\b).)'

strip_semicolon_regex = r'^;*|;*$'
name_semicolon_transformation_regex = r'(?<!\b(d))(?<!\b(da|de|di|du|d\.|la|le|mc|te|v\.))(?<!\b(dal|del|der|den|ter|ten|van|vom|von|san))(?<!\b(von\.))(?<!\b(della|dalla))(\s;|;\s|\s+|\,|\,\s|\-|;+|\\)'
semicolon_transformation_regex = r'(\s;|;\s|\s|\,|\-|;+|\\)+'

noble_name_suffix_regex = r'(;)(van(([^a-zA-Z]+(der|den|de|d\.))|\.)?|von(([^a-zA-Z]+(der|den|de|d\.))|\.)?|de la|del|di|der|den|vom|dal|della|dell|dalla|da|d|(v\.\s?d\.)|v\.|von\.|d\.|du|de|le|la|v|d|mc|ter|ten|te)($)'

letterspacing_regex = r'((?<=([\b|\s]{1}([a-z]{1})))|((?<=^[a-z]{1})))\s(?=[a-z]{1}(\s|$))'

qa_regex = r'[\(\)\[\]0-9\?,:_\/\*\"#]|\.\.|^-|-$|[^a-zA-Z]-[^a-zA-Z]'
qa_index_regex = r'[\(\)\[\]0-9\?,:_\/\*\"#]|\.\.|^-|-$|[^a-zA-Z]-[^a-zA-Z]'
qa_prisoner_no_regex = r'(.*[^0-9;\s\.\/aAbBrRzZ]+.*)'
qa_no_entry_regex = r'^-$'
qa_prisoner_no_no_entry_regex = r'^-$|[aAbBrRzZ]'

find_prisoner_number_character_separator_regex = r'(?<=[aAbBrRzZ]{1})(\s|-)(?=[0-9]{2,})'

digit_4_year_regex = r'^[12][0-9]{3}$'
date_split_regex = r'(\.\s*|\/|,\s*|\s+|\s|;|(?<=[0-9])(-)(?=[0-9]))+'
no_double_zeros_md_regex = r'^0+(?=[0-9]{2})'
no_double_zeros_y_regex = r'^0+(?=[0-9]{4})'

month_cor_list_reg = [(r'jan[a-z]*', '01'), (r'feb[a-z]*', '02'), (r'(mär[a-z]*)|(mar[a-z]*)|(maer[a-z]*)', '03'),
                      (r'a.ril', '04'), (r'ma[a-z]*|peut', '05'),
                      (r'(jun[a-z]*)|(juin)', '06'), (r'jul[a-z]*|juil[a-z]*', '07'),
                      (r'aug[a-z]*|ao[a-z]*|ag[a-z*]', '08'), (r'sep[a-z]*', '09'),
                      (r'o[c|k]t[a-z]*', '10'), (r'nov[a-z]*', '11'), (r'd.c[a-z]*', '12')]