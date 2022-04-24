import { Component, OnInit, Inject } from '@angular/core';
import { Form } from '../form';
import { MongoDbService } from '../mongo-db.service';

@Component({
  selector: 'app-forms',
  templateUrl: './forms.component.html',
  styleUrls: ['../app.component.css','./forms.component.css']
})
export class FormsComponent implements OnInit {

  forms : Form[];
  constructor(private mongodbService: MongoDbService) {

  }

  ngOnInit() {

    this.forms = Array<Form>();
    this.mongodbService.getForms().subscribe(
      data=>{
        
        for(var j=0; j < data.length; j++){
          let _form = new Form();
          _form.FormOID = data[j].FormOID;
          _form.ID = data[j].ID;
          _form.Name = data[j].Name;
          _form.Domain = data[j].Domain;
          _form.Items = [];

          for (var item of data[j].Items) { 
            //if( parseInt(item.Operator) != 0 && (parseInt(item.Operator) & user.exlusion_code) > 0 ){
              _form.Items.push(item);
          }   
          this.forms.push(_form);
        }
        

        let blob = new Blob(['\ufeff' + JSON.stringify(this.forms)], { type: 'text/csv;charset=utf-8;' });
        let dwldLink = document.createElement("a");
        let url = URL.createObjectURL(blob);

        dwldLink.setAttribute("href", url);
        dwldLink.setAttribute("download","forms.json");
        dwldLink.style.visibility = "hidden";
        document.body.appendChild(dwldLink);
        dwldLink.click();
        document.body.removeChild(dwldLink);

      }
    )
  }


}
