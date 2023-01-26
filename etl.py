import json
import pandas as pd
import re

f = open('downloads/response.json')
response = json.load(f)

df = pd.DataFrame(response).explode('jobSearchs')
df = pd.concat([df, df['jobSearchs'].apply(pd.Series)], axis=1)
df.drop(columns=['jobSearchs'], inplace=True)
df.dropna(inplace=True)
df['info'] = df['info'].apply(lambda x: '\n'.join([i for i in x if not re.match('(Hide|.+recruiting|.+profile|.*alum|.+connections|.+applicants|.+ago|Within|Promoted)', i)]))
df = df.reset_index().drop(columns=['index'])
df['date'] = pd.to_datetime(df['date']).dt.date
df['link'] = df['link'].apply(lambda x: x.split('?')[0])
df = df.drop_duplicates(['link'], keep="first")
df.to_csv('downloads/data.csv', index=False)