declare var dialogPolyfill: any;

let msgTimer : number|null = null;
let 会社名: { [key: string]: string; };
let 業種: { [key: string]: string[]; };
let 集計: Table;
let 直近集計: Table;

let 集計_titles: string[];

let categoryDlg : HTMLDialogElement;
let categorySel : HTMLSelectElement;
let selectedCategories: string[];
let helpDlg : HTMLDialogElement;

class Table{
    titles: string[];
    arrays: Array<Array<any>>;
    index: {[name: string]: number} | undefined;

    constructor(titles: string[], arrays: Array<Array<any>>){
        this.titles = titles;
        this.arrays   = arrays;

        for(let values of arrays){
            console.assert(values.length == arrays[0].length);
        }
    }

    columnIdx(title: string) : number {
        let i = this.titles.indexOf(title);
        console.assert(i != -1);

        return i;
    }

    addColumn(title: string, values: Array<any>){
        this.titles.push(title);
        this.arrays.push(values);

        console.assert(values.length == this.arrays[0].length);
    }

    setIndex(title: string){
        this.index = {};
        let icol = this.columnIdx(title);

        for(let [idx, val] of this.arrays[icol].entries()){
            this.index[val] = idx;
            let i = this.index[val];
            console.assert(i != undefined);
        }
    }

    column(title: string) : Array<any> {
        let icol = this.columnIdx(title);
        return this.arrays[icol];
    }


    columnValues(titles: string[]) : Array<Array<any>> {
        let icols = titles.map(title => this.columnIdx(title));
        let values = range(this.count()).map(row => icols.map(col => this.arrays[col][row]) );

        return values;
    }

    filter(fnc:(i:number) => boolean){
        let cnt = this.arrays[0].length;
        let mask = range(cnt).map(i => fnc(i));

        let new_arrays : Array<Array<any>> = [];
        for(let values of this.arrays){
            let new_values = range(cnt).filter(i => mask[i]).map(i => values[i]);
            new_arrays.push(new_values)
        }

        return new Table(this.titles.slice(), new_arrays)
    }

    selectValue(column: string, value: any) : Table{
        let column_idx = this.columnIdx(column);

        return this.filter(i => this.arrays[column_idx][i] == value);
    }

    selectValueList(column: string, values: any[]){
        let column_idx = this.columnIdx(column);

        return this.filter(i => values.includes( this.arrays[column_idx][i] ));
    }

    count(){
        return this.arrays[0].length;
    }

    rename(table: {[name: string]: string} ){
        for(let key of Object.keys(table)){
            let i = this.titles.indexOf(key);
            console.assert(i != -1);

            this.titles[i] = table[key];
        }
    }

    select(new_titles: string[]) : Table {
        let new_arrays : Array<Array<any>> = [];

        for(let title of new_titles){
            let i = this.titles.indexOf(title);
            console.assert(i != -1);

            new_arrays.push(this.arrays[i]);
        }

        return new Table(new_titles.slice(), new_arrays)
    }

    setFloat(titles: string[]){
        for(let title of titles){
            let icol = this.columnIdx(title);

            this.arrays[icol] = this.arrays[icol].map(x => (x.length == 0 ? NaN : parseFloat(x)) );
        }
    }

    static concat(tables: Table[]) : Table {
        let new_titles : string[] = [];
        let new_arrays : Array<Array<any>> = [];
        let length = tables[0].arrays[0].length;

        for(let tbl of tables){
            console.assert(tbl.arrays[0].length == length);

            new_titles = new_titles.concat(tbl.titles);
            new_arrays = new_arrays.concat(tbl.arrays);
        }

        return new Table(new_titles, new_arrays)
    }
}

function log(s: string){
    console.log(s)
}

function msg(s: string, elapse=NaN){
    if(msgTimer != null){
        clearTimeout(msgTimer);
    }
    let span = getDom("msg") as HTMLSpanElement;
    span.innerText = s;

    if(isNaN(elapse)){
        return;
    }
    msgTimer = setTimeout(()=>{
        msgTimer = null;
        span.innerText = "";
    }, elapse);
}

function clearMsg(){
    getDom("msg").innerText = "";
}

function range(n: number) : number[]{
    return [...Array(n).keys()];
}

function zip(v1:any[], v2:any[]){
    console.assert(v1.length == v2.length);
    return range(v1.length).map(i => [v1[i], v2[i]]);
}

function zip3(v1:any[], v2:any[], v3:any[]){
    console.assert(v1.length == v2.length && v1.length == v3.length);
    return range(v1.length).map(i => [v1[i], v2[i], v3[i]]);
}

function getDom(id: string) : HTMLElement {
    return document.getElementById(id)!;
}

function fetchText(path: string, encoding: string|undefined = undefined) {
    // Promiseクラスのインスタンスを関数の戻り値にする
    // Promiseクラスのコンストラクタの引数には関数を渡す
    // その関数は、resolve関数とreject関数を引数に取り、戻り値は無し
    return new Promise(function(resolve:(text:string)=>void) {

        let k = window.location.href.lastIndexOf("/");

        let url = `${window.location.href.substring(0, k)}/${path}`;

        const url2 = encodeURI(url);
        log(`fetch-text:${url}`);
        fetch(url2)
        .then((res: any) => {
            if(encoding == undefined){

                return res.text();
            }
            else{

                return res.arrayBuffer();
            }
        })
        .then( (data: string|ArrayBuffer) => {
            if(encoding == undefined){
                resolve(data as string);
            }
            else{

                const decoder = new TextDecoder(encoding)
                resolve(decoder.decode(data as ArrayBuffer))
            }            
        })
        .catch((error: any) => {
            console.error('Error:', error);
        });
    });
}

function parseCSV(text: string){
    let lines = text.split('\n').filter(x => x != undefined && x.length != 0);

    let titles = lines[0].split(',');
    
    lines = lines.slice(1);
    let rows = lines.map((x)=> (x[0] == '"' ? JSON.parse('[' + x + ']') : x.split(',') ) );

    let arrays : Array<Array<any>> = [];
    for (const [col, element] of titles.entries()) {
        let values = range(rows.length).map(i => {
            let s = rows[i][col];
            if(s != undefined && s.length != 0 && s[0] == '"'){
                s = s.substring(1, s.length - 1);
            }
            return s;
        })
        arrays.push(values);
    }

    return new Table(titles, arrays)
}

function downloadData(){
    msg("テータをダウンロードしています。");
    fetchText("data/summary-join.csv")
    .then((text) => {
        msg("テータをダウンロードしています。■");

        集計 = parseCSV(text);
    
        let codes = 集計.column('EDINETコード');

        集計_titles = 集計.titles.filter(x => ! ['EDINETコード', '提出日', '会計期間終了日', '会社名', '業種'].includes(x));
        集計.setFloat(集計_titles);

        直近集計 = 集計.filter(i => i == 集計.count() - 1 || codes[i] != codes[i + 1] );
    
        会社名 = {};
        業種 = {};
        for(let [code, name, category] of zip3(直近集計.column('EDINETコード'), 直近集計.column('会社名'), 直近集計.column('業種'))){
            会社名[code] = name;
            if(業種[category] == undefined){
                業種[category] = [];
            }
            業種[category].push(code);
        }

        setCategoryDlg();

        msg("業種を指定してください。");
        getDom("category-btn").style.display = "inline-block";
    });
}

function selectData(tbl: Table, selection:string[], titles: string[]){
    let df = tbl.select(['EDINETコード', '会社名', '業種', '会計期間終了日'].concat(titles));
    if(selection.length == 0){
        return df;
    }
    else{
        return df.selectValueList('EDINETコード', selection);
    }
}

function joinTable(tbl: Table, selection:string[], titles: string[]){
    let df = Table.concat([ 
        集計.select(['EDINETコード', '会社名', '会計期間終了日']), 
        tbl.select(titles), 
    ]);

    if(selection == undefined){
        return df;
    }
    else{
        return df.selectValueList('EDINETコード', selection);
    }
}


function setCategoryDlg(){
    for(let name in 業種){
        let opt = document.createElement("option");
        opt.value = name;
        opt.innerText = `${name} ${業種[name].length}社`;
        categorySel.appendChild(opt);
    }
}

function showCategoryDlg(){
    clearMsg();
    categoryDlg.showModal();
}

function okCategoryDlg(){
    selectedCategories = Array.from(categorySel.selectedOptions).map(x => x.value);
    if(selectedCategories.length == 0){
        alert("業種を１つ以上選択してください。");
        return;
    }

    categoryDlg.close();

    addChart(ChartType.Scatter);
}

function bodyOnLoad(){
    downloadData();    
    setUI();
}

function setUI() {
    addChartDlg = getDom('add-chart-dlg') as HTMLDialogElement;
    addChartSel = getDom('titles-sel') as HTMLSelectElement;
    categoryDlg = getDom("category-dlg") as HTMLDialogElement;
    categorySel = getDom("categories-sel") as HTMLSelectElement;
    helpDlg = getDom('help-dlg') as HTMLDialogElement;

    dialogPolyfill.registerDialog(addChartDlg);
    dialogPolyfill.registerDialog(categoryDlg);
    dialogPolyfill.registerDialog(helpDlg);

    getDom('okDlg')!.addEventListener('click', function() {
        let cnt = Array.from(addChartSel.selectedOptions).length;
        let msg = null;
        switch(MyChart.type){
            case ChartType.Scatter:
                if(cnt != 2){
                    msg = "グラフに表示する項目を2つ選択してください。";
                }
                break;
            case ChartType.Bar:
                if(cnt == 0){
                    msg = "グラフに表示する項目を1つ以上選択してください。";
                }
                break;
            case ChartType.Line:
                if(cnt != 1){
                    msg = "グラフに表示する項目を1つ選択してください。";
                }
                break;
            default:
                console.assert(false);
                break;
        }

        if(msg != null){
            alert(msg);
            return;
        }

        addChartDlg.close();
        MyChart.makeChart();

        getDom("add-chart-div").style.display = "block";
    });

    getDom('cancelDlg')!.addEventListener('click', function() {
        addChartDlg.close();
    });

    addChartDlg.addEventListener('click', function(event) {
        if (event.target === addChartDlg) {
            addChartDlg.close('cancelled');
        }
    });
}

function addChart(e: ChartType){
    MyChart.type = e;
    let msg = "";

    if(e != ChartType.Scatter){
        let sum = charts[charts.length - 1].getSelection().length;
        console.log(`会社数: ${sum}`);
        if(20 < sum){

            alert("グラフに表示する会社数が多すぎます。\n\n散布図で表示する会社を選択してください。")
            return;
        }
    }

    switch(e){
    case ChartType.Scatter:
        msg = "グラフに表示する項目を2つ選択してください。";
        break;
    case ChartType.Bar:
        msg = "グラフに表示する項目を選択してください。( 複数選択可 )";
        break;
    case ChartType.Line:
        msg = "グラフに表示する項目を1つ選択してください。";
        break;
    default:
        console.assert(false);
        break;
    }

    addChartSel.innerHTML = "";

    for(let title of 集計_titles){
        let opt = document.createElement("option");
        opt.innerText = title;
        addChartSel.appendChild(opt);
    }

    let span = getDom("add-chart-msg") as HTMLSpanElement;
    span.innerText = msg;

    addChartDlg.showModal();
}
