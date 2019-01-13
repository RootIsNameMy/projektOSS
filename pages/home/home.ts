import { Component, ViewChild, ElementRef} from '@angular/core';
import { NavController, Slides} from 'ionic-angular';
import { HTTP } from "@ionic-native/http";
import {  Storage } from '@ionic/storage';
import { DetailsPage } from "../details/details";
import { AlertController, ToastController, Events, LoadingController } from "ionic-angular";



@Component({
  selector: 'page-home',
  templateUrl: 'home.html',

})

export class HomePage {
  @ViewChild('slider') slider: Slides;
  @ViewChild('scrollWraper') scrollWrapper: ElementRef;
  @ViewChild('scrollWraper1') scrollWrapper1: ElementRef;
  @ViewChild('scrollWraper2') scrollWrapper2: ElementRef;
  @ViewChild('header') header: ElementRef;
  @ViewChild('footer') footer: ElementRef;
  @ViewChild('slider') sliderElem: ElementRef;
  @ViewChild('shelfList') shelfList: ElementRef;

  //search inputs
  @ViewChild('simpleSearch') simpleSearchElem: ElementRef;



  pageNames = ["Police","Išči","Brskaj"];
  sliderIndex = 0;
  pageName = "Police";
  desktop = false;
  constructor(private loadingCtrl:LoadingController,public events: Events,private toastCtrl: ToastController, private alertCtrl: AlertController,public navCtrl: NavController, private http: HTTP, private storage: Storage) {
    this.sliderIndex = 0;


    events.subscribe("back:pressed", (data) => {
      this.SetupShelf();
      console.log(data);
    });

   
  }
  ionViewDidLoad() {
    this.ScrollWraperSetup();
    this.SetupShelf();

    this.SetupSimpleSearch();
    this.SetupBrowseSearch();
    this.SetupAdvancedSearch();
  }
  ngAfterViewInit() {
    
  }
  ScrollWraperSetup() {
    this.BrowseConstructor();
    var headH = this.header.nativeElement.clientHeight-7;
    var footH = this.footer.nativeElement.clientHeight-3;
    var elems = [this.scrollWrapper.nativeElement, this.scrollWrapper1.nativeElement, this.scrollWrapper2.nativeElement];
   
    console.log(headH);
    console.log(footH);
    for (var i = 0; i < 3; i++) {
      elems[i].style.paddingTop = headH + "px";
      elems[i].style.paddingBottom = footH + "px";
    }
    
  }
  selectedTab(index) {
    this.sliderIndex = index;
    this.pageName = this.pageNames[index];
    this.slider.slideTo(index);
  }
  slideChanged() {
    console.log(this.slider.getActiveIndex());
    this.sliderIndex = this.slider.getActiveIndex();
    this.pageName = this.pageNames[this.sliderIndex];
  
  }

  

  //--HTTP test
  GetHTTP() {
    //var obj = this;
    return this.http.get('https://repozitorij.uni-lj.si/ajax.php', { cmd: "getBrowse", pageSize:"20", cat1: "naslov", cat2: "a", page:"0"  }, {})
      .then(data => {
      console.log( data.status);
        
        console.log(JSON.parse(data.data));
        
        
      console.log( data.headers);
      })
      .catch(error => {
      console.log( error.status);
      console.log( error.data);
      console.log(  error.headers);
    });
  }


  //--------Shelf--------//
  storedItems: any;
  noMoreToLoad: boolean = false;
  SetupShelf() {
    var obj = this;


    

    this.storage.get("shelfs").then((val2) => {

      if (val2 == null)//no shelfs yet
      {
        obj.storage.set("shelfs", [
          {
            title:"Neurejeni",
            val: "null",
            result: []
          }
        ]);
        obj.storedItems = [
          {
            title: "Neurejeni",
            val: "null",
            result: []
          }
        ]
        obj.FillShelf();
      }
      else {

        console.log(val2);

        obj.storedItems = val2;
        obj.FillShelf();
      }

    });
  }
  FillShelf() {
    var obj = this;
    obj.storage.keys().then((val) => {
      console.log(val);
      if (val.length > 0) {
        for (var s = 0; s < obj.storedItems.length; s++) {
          for (var i = 0; i < val.length; i++) {
            if(val[i]!="shelfs")//so we dont get an error
            obj.FillElement(s,i,val);
          }
        }

        //end
       
      }
      else {
        console.log("Storage is empty");
      }
    });
  }
  FillElement(s, i, val) {
    var obj = this;
    obj.storage.get(val[i]).then((val1) => {

      var shelfId = val1.shelf;
      if (obj.storedItems[s].val == shelfId)//this item belongs on this shelf
      {
        console.log("this item belongfs on this shelf");
        //--title
        var title = val1.result.Naslov;
        //--date
        var date = val1.result.DatumObjave.split(" ")[0];
        var dates = date.split("-");
        date = dates[2] + "-" + dates[1] + "-" + dates[0];
        //--avtor
        var avtor = "";
        var osebe = val1.result.Osebe;
        var stAvtor = 0;
        for (var i = 0; i < osebe.length; i++) {
          var oseba = osebe[i];
          var ime = oseba.Ime;
          var priimek = oseba.Priimek;
          if (oseba.VlogaNaziv == "Avtor") {
            if (stAvtor > 0) {
              avtor += ", ";
            }
            
            avtor += ime + " " + priimek;
            stAvtor++;
            if (stAvtor > 1) {
              avtor += "...";
              break;
            }

          }
        }
        //--organization
        var organizacija = val1.result.Organizacija.Naziv;
        var id = val1.result.ID;
        obj.storedItems[s].result.push({
          title: title,
          date: date,
          organization: organizacija,
          author: avtor,
          shelf: shelfId,
          id: id

        });
        
      }
      else {
        console.log("this item doesn't belong on this shelf");
      }


      
    })
  }
  
  ListEdit(shelf0) {
    var obj = this;
    var buttons = [

      {
        text: 'Preimenuj',
        handler: data => {
          let alert1 = obj.alertCtrl.create({
            title: "Preimenuj polico",
            inputs: [
              {
                name: "title",
                placeholder: shelf0.title
              }
            ],
            buttons: [
              {
                text: "Prekliči",
                role: "cancel",
                handler: data => {

                }
              },
              {
                text: "Shrani",
                handler: data => {
                  console.log("preimenoval na " + data.title);
                  this.RenameShelf(shelf0, data.title)
                }
              }
            ]
          });
          alert1.present();
        }
      },
      {
        text: "Ustvari",
        handler: data => {
          let alert1 = obj.alertCtrl.create({
            title: "Ustvari polico",
            inputs: [
              {
                name: "title",
                placeholder: "lepa polica"
              }
            ],
            buttons: [
              {
                text: "Prekliči",
                role: "cancel",
                handler: data => {

                }
              },
              {
                text: "Shrani",
                handler: data => {
                  console.log("ustvaril polico z imenom " + data.title);
                  obj.AddShelf(data.title);
                }
              }
            ]
          });
          alert1.present();
        }
      },
      {
        text: 'Preklici',
        role: 'cancel',
        handler: data => {
          console.log('Cancel clicked');
        }
      }
    ];
    if (shelf0.val != "null")//not the default shelf
    {
      buttons.push({
        text: "Izbriši",
        handler: data => {
          let alert1 = obj.alertCtrl.create({
            title: "Brisanje \"" + shelf0.title + "\"",
            subTitle: "Ali hocete nadeljevati?",
            buttons: [
              {
                text: 'Prekliči',
                role: 'cancel',
                handler: data => {
                  console.log('Cancel clicked');
                }
              },
              {
                text: 'Izbriši',
                handler: data => {
                  obj.RemoveShelf(shelf0);
                }
              }
            ]
          });
          alert1.present();
        }

      });
    }

    let alert0 = this.alertCtrl.create({
      title: shelf0.title,
      buttons: buttons
    })
    alert0.present();
  }
  AddShelf(name) {
    var key = this.GuidGenerator();
    var obj = this;
    this.storage.get("shelfs").then((data) => {
      var shelfs = data;
      shelfs.push({
        title: name,
        val: key + name,
        result: []
      });
      this.storage.set("shelfs", shelfs).then((data) => {
        console.log("new shelf added " + data);
        this.ToastBottom("\"" + name + "\" dodana med police!", 2000);
        this.SetupShelf();
        
      });
    });
  }
  RemoveShelf(shelf0) {
    var index = this.GetShelfIndex(shelf0);
    if (index == -1) {
      console.log("ta polica ne obstaja");
      return;
    }
    if (this.storedItems[index].result.length > 0) {
      var alert = this.alertCtrl.create({
        title: "Polica mora biti prazan, da jo lahko odstraniš!",
        buttons: ['Dismiss']
      });
      alert.present();

      return;
    }
    this.storage.get("shelfs").then((data) => {
      console.log(data);
      data.splice(index, 1);
      console.log(data);
      this.storage.set("shelfs", data).then(() => {
        this.ToastBottom("\"" + shelf0.title + "\" je bila odstranjena!", 2000);
        this.SetupShelf();
      });
    });
  }
  RenameShelf(shelf0,name) {
    var index = this.GetShelfIndex(shelf0);
    if (index == -1) {
      console.log("ta polica ne obstaja");
      return;
    }
    this.storage.get("shelfs").then((data) => {
      console.log(data);
      data[index].title = name;
      console.log(data);
      this.storage.set("shelfs", data).then(() => {
        this.ToastBottom("\"" + shelf0.title + "\" je bila preimenovana na \"" + data[index].title + "\"!", 2000);
        this.SetupShelf();
        
      });
    });
  }
  GetShelfIndex(shelf0) {
    for (var i = 0; i < this.storedItems.length; i++) {
      if (this.storedItems[i] === shelf0) {
        console.log(" index" + i);
        return i;
      }
    }
    return -1;
  }
  GuidGenerator() {
    var S4 = function () {
      return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };
    return (S4() + S4() + S4() );
  }
  ToastBottom(message,time=1000) {
    var toast = this.toastCtrl.create({
      message: message,
      duration: time,
      position: "bottom"
    });
    toast.present();
  }
  MoveItem(item,shelf0) {
    var inputs = [];

    var shelfIndex = this.GetShelfIndex(shelf0);
    if (shelfIndex == -1) {
      console.log("shelf index does not exist!")
      return;
    }

    for (var i = 0; i < this.storedItems.length; i++) {
      var shelf = this.storedItems[i];
      var checked = false;
      if (i == shelfIndex) {
        checked = true;
      }
      inputs.push({
        type: "radio",
        label: shelf.title,
        value: i.toString(),
        checked: checked,

      })
    }
    let alert = this.alertCtrl.create({
      title: "Spremeni polico!",
      inputs: inputs,
      buttons: [
        {
          text: "Prekliči",
          role: "cancel",
          handler: data => {

          }
        },
        {
          text: "Shrani",
          handler: data => {
            console.log(data);
            this.MoveItemToShelf(item, data);
          }
        }
      ]
    });
    alert.present();
  }
  
  MoveItemToShelf(item, index) {
    var shelfVal = this.storedItems[index].val;
    this.storage.get(String(item.id)).then((data) => {
      data.shelf = shelfVal;
      this.storage.set(String(item.id), data).then(() => {
        this.ToastBottom("Premaknjen na \"" + this.storedItems[index].title + "\"!", 2000);
        this.SetupShelf();
        
      })
    });
  }







  //-------Browse--------//
  items: any[];
  page: 0;
  numOfRec: 0;
  currentRec: 0;
  BrowseConstructor() {
    console.log(this.scrollWrapper.nativeElement.scrollTop);
    this.scrollWrapper.nativeElement.scrollTo(0, 0);
    console.log(this.scrollWrapper.nativeElement.scrollTop);

    this.SetScrollWraper();

    this.items = [];
    this.page = 0;

    if (this.desktop) {
      this.GetInfoDesk();
    }
    else {
      this.GetInfo();
    }
    
    
    


  }

  Loaded() {
    console.log("up");
  }
  scrollTopPrev: 0;
  SetScrollWraper() {
    var obj = this;
    this.scrollWrapper.nativeElement.onscroll = function (e) {
      
      var scrollMax = e.target.scrollHeight - e.target.clientHeight;
      var scrollTop = e.target.scrollTop;
      if (scrollMax == 0||this.noMoreToLoad) return;
      console.log(scrollTop + "/" + scrollMax);
      if (scrollTop >= 0.9 * scrollMax) {
        obj.LoadMore();
      }
     


      obj.scrollTopPrev = scrollTop;
    }
  }


  //-----Clear search
  GetInfoDesk() {
    this.gettingPage++;
   
    var method = 'GET';
    var url = "https://repozitorij.uni-lj.si/ajax.php" + this.searchParamsDesk+ 0;
    var obj = this;

 

    var xhr = new XMLHttpRequest();
    xhr.onload = function () {
      obj.gettingPage--;

      

      var responseText = xhr.responseText;
      //console.log(responseText);
      var result = JSON.parse(responseText);

      var pageInfo = result.pagingInfo;

      obj.currentRec = 0;
      obj.numOfRec = pageInfo.numberOfRecords;
      console.log(obj.numOfRec);

      obj.GetPageDesk();





    };

    xhr.onerror = function () {
      obj.gettingPage--;
      console.log('There was an error!');
    };

    xhr.open(method, url, true);
    xhr.send();
  }

  GetInfo() {
    this.gettingPage++;
    var obj = this;

    //presload the number of records that will be loaded in
    console.log(obj.searchParams);
    return this.http.get('https://repozitorij.uni-lj.si/ajax.php', obj.searchParams, {})
      .then(data => {
        obj.gettingPage--;

       
        

        console.log(data.status);

        console.log(JSON.parse(data.data));
        
        var responseText = data.data;
        var result = JSON.parse(responseText);

        var pageInfo = result.pagingInfo;

        obj.currentRec = 0;
        obj.numOfRec = pageInfo.numberOfRecords;
        console.log(obj.numOfRec);

        obj.GetPage();

        console.log(data.headers);
      })
      .catch(error => {
        obj.gettingPage--;
        console.log(error.status);
        console.log(error.data);
        console.log(error.headers);
      });

 
      


  }
  searchButtonDisabled: Boolean = false;
  GetPageDesk() {
    this.gettingPage++;
    if (this.currentRec >= this.numOfRec) {
      return;
    }
    this.page++;
    var method = 'GET';
    var url = "https://repozitorij.uni-lj.si/ajax.php" + this.searchParamsDesk + this.page;
    var obj = this;

    //presload the number of records that will be loaded in
    console.log(event);
    for (var i = 0; i < 20; i++) {

      if (this.currentRec >= this.numOfRec) {

        this.scrollWrapper.nativeElement.onscroll = "";
        console.log("no more to load");
        break;
      }
      obj.items.push({
        title: "",
        date: "",
        organization: "",
        author: "",
        lang: "",
        id: -1

      });
      this.currentRec++;


    }
    if (this.currentRec >= this.numOfRec) {

      this.scrollWrapper.nativeElement.onscroll = "";
      console.log("no more to load");

    }

    
    var xhr = new XMLHttpRequest();
    xhr.onload = function () {

      //got data
      obj.gettingPage--;
      

      var responseText = xhr.responseText;

      var result = JSON.parse(responseText);

      var pageInfo = result.pagingInfo;


      console.log(result);//temprary
      result = result.results;
      console.log(result);//temporary



      //display items
      for (var i = 0; i < result.length; i++) {
        var res = result[i];
        var fullDate = res.DatumObjave;
        var date = fullDate.split(" ")[0];
        date = date.split("-");
        var index = i + pageInfo.startRecord;
        var author = "";
        for (var b = 0; b < Math.min(res.Osebe.length, 2); b++) {
          var oseba = res.Osebe[b];
          //console.log(oseba);
          author += oseba.Ime;
          author += " ";
          author += oseba.Priimek;
          if (b + 1 < Math.min(res.Osebe.length, 2)) {
            author += ", ";
          }
        }
        if (res.Osebe.length > 2) {
          author += "..";
        }
        obj.items[index] = {
          title: res.Naslov,
          date: date[2] + "-" + date[1] + "-" + date[0],
          organization: res.Organizacija.Naziv,
          author: author,
          id: res.ID

        };

      }





    };

    xhr.onerror = function () {
      console.log('There was an error!');
      //got data
      obj.gettingPage--;
    };

    xhr.open(method, url, true);
    xhr.send();
  }
  gettingPage=0;
  GetPage() {
    this.gettingPage++;
    if (this.currentRec >= this.numOfRec) {
      return;
    }
    this.page++;
    
    var obj = this;

    //presload the number of records that will be loaded in
    
    for (var i = 0; i < 20; i++) {

      if (this.currentRec >= this.numOfRec) {

        this.scrollWrapper.nativeElement.onscroll = "";
        console.log("no more to load");
        break;
      }
      obj.items.push({
        title: "",
        date: "",
        organization: "",
        author: "",
        lang: "",
        id: -1

      });
      this.currentRec++;


    }
    if (this.currentRec >= this.numOfRec) {

      this.scrollWrapper.nativeElement.onscroll = "";
      console.log("no more to load");

    }
    obj.searchParams.page = String(this.page);
    return this.http.get('https://repozitorij.uni-lj.si/ajax.php', obj.searchParams, {})
      .then(data => {
        //got data
        obj.gettingPage--;



        console.log(data.status);

        console.log(JSON.parse(data.data));

        var responseText = data.data;
        var result = JSON.parse(responseText);

        var pageInfo = result.pagingInfo;


        console.log(result);//temprary
        result = result.results;
        console.log(result);//temporary



        //display items
        for (var i = 0; i < result.length; i++) {
          var res = result[i];
          var fullDate = res.DatumObjave;
          var date = fullDate.split(" ")[0];
          date = date.split("-");
          var index = i + pageInfo.startRecord;
          var author = "";
          for (var b = 0; b < Math.min(res.Osebe.length, 2); b++) {
            var oseba = res.Osebe[b];
            console.log(oseba);
            author += oseba.Ime;
            author += " ";
            author += oseba.Priimek;
            if (b + 1 < Math.min(res.Osebe.length, 2)) {
              author += ", ";
            }
          }
          if (res.Osebe.length > 2) {
            author += "..";
          }
          obj.items[index] = {
            title: res.Naslov,
            date: date[2] + "-" + date[1] + "-" + date[0],
            organization: res.Organizacija.Naziv,
            author: author,
            id: res.ID

          };

        }

        console.log(data.headers);
      })
      .catch(error => {
        //got data
        obj.gettingPage--;


        console.log(error.status);
        console.log(error.data);
        console.log(error.headers);
      });

      





  

    
  }
  
  LoadMore() {
    console.log("Load More");

    if (this.desktop) {
      this.GetPageDesk();
    }
    else {
      this.GetPage();
    }
  


  
  }
  FilterOpen() {
    console.log("filter");
  }
  currentLoadingSpinner: any;
  ItemDetails(item) {
    this.currentLoadingSpinner = this.loadingCtrl.create({
      spinner: "dots",
      content: "Nalaganje, prosim počakajte...",
      dismissOnPageChange: true
    });
    this.currentLoadingSpinner.present();
    console.log(item);
    console.log("#----DETAILS----#");

    

    
    if (this.desktop) {
      this.GetDocDesk(item.id);
    }
    else {
      this.GetDoc(item.id);
    }
  }
  GetDocDesk(id) {

    var method = 'GET';
    var url = "https://repozitorij.uni-lj.si/ajax.php?cmd=getDocument&gID="+id;
    var obj = this;



    var xhr = new XMLHttpRequest();
    xhr.onload = function () {
      var responseText = xhr.responseText;
      
      var result = JSON.parse(responseText);
      
      obj.navCtrl.push(DetailsPage, {
        result: result,
        desktop: obj.desktop
      });

    };

    xhr.onerror = function () {
      console.log('There was an error!');
    };

    xhr.open(method, url, true);
    xhr.send();
  }
  GetDoc(id) {
    var obj = this;

    //presload the number of records that will be loaded in

    return this.http.get('https://repozitorij.uni-lj.si/ajax.php', { cmd: "getDocument", gID: String(id) }, {})
      .then(data => {
        console.log(data.status);

        console.log(JSON.parse(data.data));

        var responseText = data.data;
        var result = JSON.parse(responseText);

        obj.navCtrl.push(DetailsPage, {
          result: result,
          desktop: obj.desktop
        });

        console.log(data.headers);
      })
      .catch(error => {
        console.log(error.status);
        console.log(error.data);
        console.log(error.headers);
      });
  }
  //-----Search input page-----//
  searchParams: any= {
      cmd: "getSearch",
      source: "dk",
      pageSize: "20",
      page: "0"
    
  }
  searchParamsDesk = "?cmd=getSearch&source=dk&pageSize=20&query=hrana&page=";
  
  //--Simple search
  ssOptions: any;
  ssSelectedVal = "dk";
  ssSearchVal = "";
  SetupSimpleSearch() {


    //get
    this.ssOptions = [];
    if (this.desktop) {
      this.GetSSOptionsDesk();
    }
    else {
      this.GetSSOptions();
    }
  }
  GetSSOptions() {
    var obj = this;

    //presload the number of records that will be loaded in

    return this.http.get('https://repozitorij.uni-lj.si/ajax.php', { cmd: "getSearch"}, {})
      .then(data => {
        console.log(data.status);

        console.log(JSON.parse(data.data));

        var responseText = data.data;
        var result = JSON.parse(responseText);
        var array = result.query.source.listItems;
        for (let item of array) {
          if (item[0] == "cobiss") break;
          obj.ssOptions.push({
            title: item[1],
            val: item[0]
          });
        }
        

        console.log(data.headers);
      })
      .catch(error => {
        console.log(error.status);
        console.log(error.data);
        console.log(error.headers);
      });
  }
  GetSSOptionsDesk() {
    var method = 'GET';
    var url = "https://repozitorij.uni-lj.si/ajax.php?cmd=getSearch";
    var obj = this;



    var xhr = new XMLHttpRequest();
    xhr.onload = function () {
      var responseText = xhr.responseText;

      var result = JSON.parse(responseText);
      console.log(result);
      var array = result.query.source.listItems;
      for (let item of array) {
        if (item[0] == "cobiss") break;
        obj.ssOptions.push({
          title: item[1],
          val: item[0]
        });
      }
      

    };

    xhr.onerror = function () {
      console.log('There was an error!');
    };

    xhr.open(method, url, true);
    xhr.send();
  }


  ssCheckVal: boolean= false;
  SimpleSearchClick() {
    console.log(this.ssSearchVal);
    
    console.log(this.ssCheckVal);
    console.log(this.ssSelectedVal);
    //insert items
    //desktop
    var params = "?cmd=getSearch&fullTextOnly=" + this.ssCheckVal + "&source=" + this.ssSelectedVal + "&pageSize=20&query=" + this.ssSearchVal + "&page=";

    this.searchParamsDesk = params;
    //mobile
    this.searchParams = {
      cmd: "getSearch",
      source: this.ssSelectedVal,
      pageSize: "20",
      query: this.ssSearchVal,
      fullTextOnly: this.ssCheckVal.toString(),
      page:"0"
    }
    



    //delete current one
    this.BrowseConstructor();

    this.selectedTab(2);



   
  }
  
  //--Browse
  browseCat1Val= "";
  browseCat2Val= "";
  browseCat3Val= "";

  browseCat2Visible: boolean = false;
  browseCat3Visible: boolean = false;

  browseCat1: any;
  browseCat2: any;
  browseCat3: any;

  SetupBrowseSearch() {


    if (this.desktop) {
      this.GetBrowseOptionsDesk();
    }
    else {
      this.GetBrowseOptions();
    }
  }
  GetBrowseOptions() {
    var obj = this;

    //presload the number of records that will be loaded in

    return this.http.get('https://repozitorij.uni-lj.si/ajax.php', {
      cmd: "getBrowse",
      cat1: obj.browseCat1Val,
      cat2: obj.browseCat2Val,
      cat3: obj.browseCat3Val
    }, {})
      .then(data => {
        console.log(data.status);

        console.log(JSON.parse(data.data));

        var responseText = data.data;
        var result = JSON.parse(responseText);
        obj.browseCat1 = [];
        obj.browseCat2 = [];
        obj.browseCat3 = [];

        var cat1List = result.cat1;
        for (let item of cat1List) {
          obj.browseCat1.push({
            title: item[1],
            val: item[0]
          })
        }
        if (result.hasOwnProperty('cat2')) {
          var cat2List = result.cat2;
          for (let item of cat2List) {
            obj.browseCat2.push({
              title: item[1],
              val: item[0]
            })
          }
          obj.browseCat2Visible = true;

          if (result.hasOwnProperty('cat3')) {
            var cat3List = result.cat3;
            for (let item of cat3List) {
              obj.browseCat3.push({
                title: item[1],
                val: item[0]
              })
            }
            obj.browseCat3Visible = true;
          }
          else {
            obj.browseCat3Visible = false;
          }

        }
        else {
          obj.browseCat2Visible = false;
          obj.browseCat3Visible = false;
        }

        if (obj.currentLoadingSpinner != null) obj.currentLoadingSpinner.dismiss();
         
        console.log(data.headers);
      })
      .catch(error => {
        console.log(error.status);
        console.log(error.data);
        console.log(error.headers);
        if (obj.currentLoadingSpinner != null) obj.currentLoadingSpinner.dismiss();
      });
  }
  GetBrowseOptionsDesk() {
    var method = 'GET';
    var url = "https://repozitorij.uni-lj.si/ajax.php?cmd=getBrowse&cat1=" + this.browseCat1Val + "&cat2=" + this.browseCat2Val + "&cat3=" + this.browseCat3Val;
    var obj = this;



    var xhr = new XMLHttpRequest();
    xhr.onload = function () {
      var responseText = xhr.responseText;

      var result = JSON.parse(responseText);
      console.log(result);
      obj.browseCat1 = [];
      obj.browseCat2 = [];
      obj.browseCat3 = [];

      var cat1List = result.cat1;
      for (let item of cat1List) {
        obj.browseCat1.push({
          title: item[1],
          val: item[0]
        })
      }
      if (result.hasOwnProperty('cat2')) {
        var cat2List = result.cat2;
        for (let item of cat2List) {
          obj.browseCat2.push({
            title: item[1],
            val: item[0]
          })
        }
        obj.browseCat2Visible = true;

        if (result.hasOwnProperty('cat3')) {
          var cat3List = result.cat3;
          for (let item of cat3List) {
            obj.browseCat3.push({
              title: item[1],
              val: item[0]
            })
          }
          obj.browseCat3Visible = true;
        }
        else {
          obj.browseCat3Visible = false;
        }

      }
      else {
        obj.browseCat2Visible = false;
        obj.browseCat3Visible = false;
      }
      
      if (obj.currentLoadingSpinner != null) obj.currentLoadingSpinner.dismiss();

    };

    xhr.onerror = function () {
      console.log('There was an error!');
      if (obj.currentLoadingSpinner != null) obj.currentLoadingSpinner.dismiss();
    };

    xhr.open(method, url, true);
    xhr.send();
  }

  BrowseCat1Change(event: string) {
    console.log(event);
    this.browseCat1Val = event;

    //chage cat 2,3
    this.browseCat2Visible = false;
    this.browseCat2Val = "";
    this.browseCat3Visible = false;
    this.browseCat3Val = "";

    this.currentLoadingSpinner = this.loadingCtrl.create({
      spinner: "dots",
      content: "Nalaganje, prosim počakajte...",
      dismissOnPageChange: true
    });
    this.currentLoadingSpinner.present();

    this.SetupBrowseSearch();
    

    
  }
  BrowseCat2Change(event: string) {
    console.log(event);
    this.browseCat2Val = event;

    //chage cat 3
    this.browseCat3Visible = false;
    this.browseCat3Val = "";

    this.currentLoadingSpinner = this.loadingCtrl.create({
      spinner: "dots",
      content: "Nalaganje, prosim počakajte...",
      dismissOnPageChange: true
    });
    this.currentLoadingSpinner.present();

    this.SetupBrowseSearch();
    
  }

  BrowseClick() {
    console.log(this.browseCat1Val);
    console.log(this.browseCat2Val);
    console.log(this.browseCat3Val);

    if (this.browseCat1Val == "" || this.browseCat2Val == "" && this.browseCat2Visible || this.browseCat3Val == "" && this.browseCat3Visible) return;

    //insert items
    //desktop
    var params = "?cmd=getBrowse&cat1=" + this.browseCat1Val + "&cat2=" + this.browseCat2Val + "&cat3=" + this.browseCat3Val + "&pageSize=20&page=";

    this.searchParamsDesk = params;
    //mobile
    this.searchParams = {
      cmd: "getBrowse",
      pageSize: "20",
      cat1: this.browseCat1Val,
      cat2: this.browseCat2Val,
      cat3: this.browseCat3Val,
      page: "0"
      
    }



    //delete current one
    this.BrowseConstructor();

    this.selectedTab(2);

  }
  //--Advanced search
  advancedSearchVal = [
    {
      val: "",
      op: "and",
      col:"avtor"
    },
    {
      val: "",
      op: "and",
      col: "naslov"
    },
    {
      val: "",
      op: "and",
      col: "opis"
    },
    {
      val: "",
      op: "and",
      col: "letoIzida"
    }
  ];
  advancedSearchOtherVal = {
    vg: "",
    lang: "",
    ip: "dk"
  }
  advancedSearchFull: boolean = false;
  advancedSearchCol: any;
  advancedSearchOp: any;
  advancedSearchVG: any;//vrste gradiv
  advancedSearchLang: any;//jezik
  advancedSearchIP: any; //isci po
  SetupAdvancedSearch() {

    if (this.desktop) {
      this.GetASOptionsDesk();
    }
    else {
      this.GetASOptions();
    }
  }

  GetASOptions() {
    var obj = this;

    //presload the number of records that will be loaded in

    return this.http.get('https://repozitorij.uni-lj.si/ajax.php', {
      cmd: "getAdvancedSearch"
    }, {})
      .then(data => {
        console.log(data.status);

        console.log(JSON.parse(data.data));

        var responseText = data.data;
        var result = JSON.parse(responseText);
        //col
        obj.advancedSearchCol = result.query.string1.listItems;
        //op
        obj.advancedSearchOp = result.query.string1.operators;

        //vrst gradiv
        obj.advancedSearchVG = result.query.workType.listItems;
        obj.advancedSearchOtherVal.vg = obj.advancedSearchVG[0][0];

        //jezik
        obj.advancedSearchLang = result.query.language.listItems;
        obj.advancedSearchOtherVal.lang = obj.advancedSearchLang[0][0];

        //isci po
        obj.advancedSearchIP = result.query.source.listItems;
        obj.advancedSearchOtherVal.ip = obj.advancedSearchIP[0][0];

        console.log(data.headers);
      })
      .catch(error => {
        console.log(error.status);
        console.log(error.data);
        console.log(error.headers);
      });
  }
  GetASOptionsDesk() {
    var method = 'GET';
    var url = "https://repozitorij.uni-lj.si/ajax.php?cmd=getAdvancedSearch";
    var obj = this;



    var xhr = new XMLHttpRequest();
    xhr.onload = function () {
      var responseText = xhr.responseText;

      var result = JSON.parse(responseText);
      console.log(result);
      //col
      obj.advancedSearchCol = result.query.string1.listItems;
      //op
      obj.advancedSearchOp = result.query.string1.operators;

      //vrst gradiv
      obj.advancedSearchVG = result.query.workType.listItems;
      obj.advancedSearchOtherVal.vg = obj.advancedSearchVG[0][0];

      //jezik
      obj.advancedSearchLang = result.query.language.listItems;
      obj.advancedSearchOtherVal.lang = obj.advancedSearchLang[0][0];

      //isci po
      obj.advancedSearchIP = result.query.source.listItems;
      obj.advancedSearchOtherVal.ip = obj.advancedSearchIP[0][0];

      



    };

    xhr.onerror = function () {
      console.log('There was an error!');
    };

    xhr.open(method, url, true);
    xhr.send();
  }

  AdvancedSearchClick() {
    
    console.log(this.advancedSearchVal);
    console.log(this.advancedSearchOtherVal);

    var other = this.advancedSearchOtherVal;
    var val = this.advancedSearchVal;
    //insert items
    //desktop
    var params = "?cmd=getAdvancedSearch&workType=" + other.vg + "&language=" + other.lang + "&source=" + other.ip;

    for (var i = 0; i < 4; i++)
    {
      var i1 = i + 1;
      params += "&val" + i1 + "=" + val[i].val;
      params += "&op" + i1 + "=" + val[i].op;
      params += "&col" + i1 + "=" + val[i].col;
    }
    params += "&pageSize=20&page=";
    console.log(params);
    this.searchParamsDesk = params;
    //mobile
    this.searchParams = {
      cmd: "getAdvancedSearch",
      pageSize: "20",
      val1: val[0].val,
      val2: val[1].val,
      val3: val[2].val,
      val4: val[3].val,
      op1: val[0].op,
      op2: val[1].op,
      op3: val[2].op,
      op4: val[3].op,
      col1: val[0].col,
      col2: val[1].col,
      col3: val[2].col,
      col4: val[3].col,
      workType: other.vg,
      source: other.ip,
      language: other.lang,
      page: "0"
      


    }



    //delete current one
    this.BrowseConstructor();

    this.selectedTab(2);

  }



  // storage items ----HOME
  

}
