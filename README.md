# XBRL Chart
XBRLから作った決算書データをブラウザーでグラフ表示します。

## 実行手順

### 1. **ソースをダウンロードします。**

適当なフォルダーにgitでクローンします。

```bash
git clone https://github.com/teatime77/xbrl-chart.git
```

以下では **XBRL-HOME** というフォルダーにダウンロードしたとして説明します。


### 2. **TypeScriptをコンパイルします。**

```bash
cd XBRL-HOME
tsc -p ts
```

**XBRL-HOME/web/js** にコンパイルされたJavaScriptが入ります。

### 3. **CSVファイルを取得します。**

以下のファイルをダウンロードして、 **XBRL-HOME/web/data** の下に入れます。

* [http://lkzf.info/xbrl/data/summary-join.csv](http://lkzf.info/xbrl/data/summary-join.csv)

以下のようなフォルダー構成になります。

```bash
XBRL-HOME - ts
          - web - index.html
                - js
                - data - summary-join.csv
```

### 4. **アプリを実行します。**

**XBRL-HOME/web/index.html** をブラウザで開くとアプリが表示されます。

ChromeとFireFoxで動作を確認しています。

※ ajaxを使ってCSVファイルを読むので、ローカルサーバー経由で **index.html** を開く必要があります。
