import { Component, ViewChild,  Injectable } from '@angular/core';
import { NavController,  NavParams } from 'ionic-angular';
import { HTTP } from "@ionic-native/http";
import { Storage } from '@ionic/storage';

import { AlertController, ToastController, Navbar, Events } from "ionic-angular";

@Component({
  selector: 'page-details',
  templateUrl: 'details.html',

})
export class DetailsPage {
  @ViewChild(Navbar) navBar: Navbar;
  result: any;
  
  desktop: any;
  info: any;
  constructor(public events: Events, private toastCtrl: ToastController, private alertCtrl: AlertController, public navCtrl: NavController, public navParams: NavParams, private http: HTTP, private storage: Storage) {
    this.result = navParams.get("result");
    this.desktop = navParams.get("desktop");

    console.log(this.result);
    this.SetInfo(this.result);
    this.storage.keys().then((val) => {
      console.log(val);
    });
  
  }
  ionViewDidLoad() {
    this.navBar.backButtonClick = () => {
      //Write here wherever you wanna do
      this.events.publish("back:pressed", 1);
      this.navCtrl.pop()
    }
  }

 
  SetInfo(result) {
   
    //----Naslov
    var naslov = result.Naslov;

    //----Avtor/Mentor
    var avtor="";
    var mentor="";
    var osebe = result.Osebe;
    var stAvtor = 0;
    var stMentor = 0;
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

      }
      else if (oseba.VlogaNaziv == "Mentor") {
        if (stMentor > 0) {
          mentor += ", ";
        }
        mentor += ime + " " + priimek;
        stMentor++;
      }
    }

    //----Jezik
    var jezik = result.Jezik.Naziv;

    //----vrsta gradiva
    var vg = result.VrstaGradiva.Naziv;

    //----tipologija

    var tip = result.TipologijaDela.Naziv

    //----organiyacija

    var org = result.Organizacija.Naziv;

    //----opis

    var opis = result.Opis;

    //---kljucne besede

    var kb = "";
    for (var i = 0; i < result.KljucneBesede.length; i++) {
      kb += result.KljucneBesede[i];
      if (i + 1 < result.KljucneBesede.length) {
        kb += ", ";
      }
    }


    //----Datum
    var datum = result.DatumObjave.split(" ")[0];


    //----stevilo ogledov

    var so = result.StOgledov;

    //----stevilo prenosov

    var sp = result.StPrenosov;


    //------vec

    var link = result.IzpisPolniUrl;



    //----Favorite
    var id = result.ID;
    var favorite = "star-outline";
    var obj = this;
    this.storage.get(String(id)).then((val) => {
      if (val == null) {
        console.log("There is now save of id=" + id);
      }
      else {
        console.log("there is a save of id" + id);
        obj.info.favorite = "star";
        favorite = "star";
      }
      
    });
    
    this.info = {
      naslov: result.Naslov,
      avtor: avtor,
      mentor: mentor,
      jezik: jezik,
      vg: vg,
      tip: tip,
      org: org,
      opis: opis,
      kb: kb,
      datum: datum,
      so: so,
      sp: sp,
      link: link,
      favorite: favorite


    };


  }

  GetDocClick() {
    console.log(this.result.Datoteke[0].PrenosPolniUrl);
    window.open(this.result.Datoteke[0].PrenosPolniUrl, '_system');
    /*var obj = this;
    return this.http.get(this.result.Datoteke[0].PrenosPolniUrl, {}, {})
      .then(data => {
        console.log(data.status);

        console.log(data.data);


        console.log(data.headers);
      })
      .catch(error => {
        console.log(error.status);
        console.log(error.data);
        console.log(error.headers);
      });
      */
    
  }

  SetFavorite() {
    console.log(this.info.favorite);
    if (this.info.favorite == "star") {
      this.info.favorite = "star-outline";
      let toast = this.toastCtrl.create({
        message: 'Removed from favorite',
        duration: 1000,
        position: 'bottom'
      });
      toast.present();

      //remove
      this.RemoveItem();
      
    }
    else {
      this.info.favorite = "star";
      let toast = this.toastCtrl.create({
        message: 'Added to favorite',
        duration: 1000,
        position: 'bottom'
      });

      //add foavorite
      this.StoreItem();

      toast.present();
    }
  }
  RemoveItem() {
    console.log("removing item of id=" + this.result.ID);
    this.storage.remove(String(this.result.ID));
  }
  StoreItem() {
    console.log("storing item of id=" + this.result.ID);
    this.storage.set(String(this.result.ID), {
      result: this.result,
      shelf: "null"
    });
  }
  public Refresh(event) {
    console.log(event);
    if (this.desktop) {
      this.GetDocDesk(this.result.ID, event);
    }
    else {
      this.GetDoc(this.result.ID,event);
    }
  }
  GetDocDesk(id,event) {

    var method = 'GET';
    var url = "https://repozitorij.uni-lj.si/ajax.php?cmd=getDocument&gID=" + id;
    var obj = this;



    var xhr = new XMLHttpRequest();
    xhr.onload = function () {
      var responseText = xhr.responseText;

      var result = JSON.parse(responseText);

      obj.SetInfo(result);
      event.complete();
    };

    xhr.onerror = function () {
      console.log('There was an error!');
      event.complete();
    };

    xhr.open(method, url, true);
    xhr.send();
  }
  GetDoc(id,event) {
    var obj = this;

    //presload the number of records that will be loaded in

    return this.http.get('https://repozitorij.uni-lj.si/ajax.php', { cmd: "getDocument", gID: String(id) }, {})
      .then(data => {
        console.log(data.status);

        console.log(JSON.parse(data.data));

        var responseText = data.data;
        var result = JSON.parse(responseText);
        obj.SetInfo(result);
        

        console.log(data.headers);
        event.complete();
      })
      .catch(error => {
        console.log(error.status);
        console.log(error.data);
        console.log(error.headers);
        event.complete();
      });
  }
  
};
