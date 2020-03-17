# xbrl-chart
XBRLから作った決算書データをブラウザーでグラフ表示します。

## 実行手順

### 1. **gitでソースを取得します。**

適当なフォルダーにソースをダウンロードします。

```bash
git clone https://github.com/teatime77/xbrl-chart.git
```

以下では **XBRL-HOME** というフォルダーにダウンロードしたとして説明します。


### 2. **TypeScriptをコンパイルします。**

```bash
cd XBRL-HOME
tsc -p ts
```

**XBRL-HOME/web/data** にコンパイルされたJavaScriptが入ります。

### 3. **CSVファイルを取得します。**

以下の4個のCSVファイルをダウンロードします。

* [http://lkzf.info/xbrl/data/summary-0.csv](http://lkzf.info/xbrl/data/summary-0.csv)
* [http://lkzf.info/xbrl/data/summary-1.csv](http://lkzf.info/xbrl/data/summary-1.csv)
* [http://lkzf.info/xbrl/data/summary-2.csv](http://lkzf.info/xbrl/data/summary-2.csv)
* [http://lkzf.info/xbrl/data/summary-join.csv](http://lkzf.info/xbrl/data/summary-join)

ダウンロードしたファイルを **XBRL-HOME/web/data** の下に入れます。

以下のようなフォルダー構成になります。

```bash
XBRL-HOME - ts
          - web - index.html
                - js
                - data - summary-0.csv
                       - summary-1.csv
                       - summary-2.csv
                       - summary-join.csv
```

### 4. **アプリを実行します。**

XBRL-HOME/web/index.html をブラウザで開くとアプリが表示されます。

※ ajaxでローカルファイルを読むので Chrome の場合はローカルサーバーが必要です。
