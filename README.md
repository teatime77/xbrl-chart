# xbrl-chart
XBRLから作った決算書データをブラウザーでグラフ表示します。

## 実行手順

### 1.1: gitでソースを取得します。

適当なフォルダーにソースをダウンロードします。

```bash
git clone https://github.com/teatime77/xbrl-chart.git
```

以下では **XBRL-HOME** というフォルダーにダウンロードしたとして説明します。


### 1.2: TypeScriptをコンパイルします。

```bash
cd XBRL-HOME
tsc -p ts
```

### 1.3: CSVファイルを取得します。

以下のURLからEDINETのタクソノミが入ったファイルをダウンロードして解凍します。
[http://lkzf.info/xbrl/data/summary-0.csv](http://lkzf.info/xbrl/data/summary-0.csv)

[http://lkzf.info/xbrl/data/summary-1.csv](http://lkzf.info/xbrl/data/summary-1.csv)

[http://lkzf.info/xbrl/data/summary-2.csv](http://lkzf.info/xbrl/data/summary-2.csv)

[http://lkzf.info/xbrl/data/summary-join.csv](http://lkzf.info/xbrl/data/summary-join)

ダウンロードしを **XBRL-HOME/web/data** の下に入れます。
以下のようなフォルダー構成になります。

```bash
XBRL-HOME - ts
          - web - index.html
                - data - summary-0.csv
                       - summary-1.csv
                       - summary-2.csv
                       - summary-join.csv
```

### 1.4 アプリを実行します。

XBRL-HOME/web/index.html をブラウザでウェブで開くと、アプリの画面が表示されます。

※ ajaxでローカルファイルを読むので Chrome の場合はローカルサーバーが必要です。
