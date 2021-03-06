import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ActionSheetController, AlertController, Loading, LoadingController, ToastController } from 'ionic-angular';
import { SessionProvider } from '../../providers/session/session';
import { AuthService } from '../../providers/auth-service/auth-service';
import { FileUploader, FileUploaderOptions, FileItem } from 'ng2-file-upload';

@IonicPage({
  name: 'create-page'
})
@Component({
  selector: 'page-create',
  templateUrl: 'create.html',
})
export class CreatePage {
  uploadFiles = [];
  // public baseUrl: string = 'http://localhost:8080/';
  // public baseUrl: string = '';
  public baseUrl: string = 'https://ionic-node-auth.herokuapp.com/';

  public newSession: any = {
    name: '',
    desc: '',
    files: [],
    token: Date.now()
  };

  public url:string = this.baseUrl + 'session/upload';
  public queueLimit:number;
  public maxFileSize:number;
  public autoUpload:boolean = false;
  public allowedMimeType:Array<string>;
  public allowedFileType:Array<string>;
  public headers:Array<any> = [{name : 'Authorization', value: this.auth.getToken()}];
  public itemAlias: string = 'upload_file';

  private inputs:string[] = ['allowedMimeType',
      'allowedFileType',
      'autoUpload',
      'isHTML5',
      'headers',
      'maxFileSize',
      'queueLimit',
      'removeAfterUpload',
      'url',
      'itemAlias'
  ];

  public loading: Loading;

  private uploaderOptions:FileUploaderOptions = {};
  private multiple:boolean = true;

  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    private session: SessionProvider,
    // private actionSheetCtrl: ActionSheetController,
    private auth: AuthService,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController) {
  }

  ionViewCanEnter(): boolean {
    if(!this.auth.loggedIn()){
      this.navCtrl.setRoot('login-page');
      return false;
    }
    else return true;
  }

  public fileUploadService: FileUploader = new FileUploader({url: this.url});

  public ngOnInit():any {
    for (let input of this.inputs) {
      if (this[input]) {
        this.uploaderOptions[input] = this[input];
      }
    }
    this.multiple = (!this.queueLimit || this.queueLimit > 1);
    this.fileUploadService.setOptions(this.uploaderOptions);

    this.fileUploadService.onBeforeUploadItem = (fileItem: any) => {
      console.log('starting upload item: '+ fileItem.file.name);
    };

    this.fileUploadService.onCompleteAll = () => {

    }

    this.fileUploadService.onAfterAddingAll = (items) => {
      console.log(items);
    }

    this.fileUploadService.onSuccessItem = (item, response, status, headers) => {
      let file = item.file;
      this.newSession.files.push(file);
      console.log(this.newSession);
    }

    this.fileUploadService.onErrorItem = (item, response, status, headers) => {
      this.showError('Problem in uploading file: '+ item.file.name);
    }

    this.fileUploadService.onCancelItem = (item, response, status, headers) => {
      let index = this.newSession.files.indexOf(item);
      if(index !== -1)
        this.newSession.files.splice(index, 1);
    }

    this.fileUploadService.onWhenAddingFileFailed = (item, filter, options) => {
      this.showError('Please uploading a suitable file media type!');
      console.log(item, filter, options);
    }

  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad CreatePage');
  }

  mediaCapture() {

  }

  createSession(form) {
    if(!form.valid) return this.showError('All fields are required!');
    if(this.fileUploadService.isUploading) return this.showError('Please wait for files to complete uploading!');
    if(!this.newSession.files.length) return this.showError('Atleast one file must be uploaded in each session!');
    this.showLoading();
    console.log('create session!');
    console.log(this.newSession);
    this.session.createSession(this.newSession).subscribe( data => {
      this.loading.dismiss();
      form.reset();
      this.fileUploadService.clearQueue();
      this.newSession.files = [];
      this.newSession.token = Date.now();
      if(data.success) {
        this.presentToast('Session Created!');
        this.navCtrl.setRoot('home-page');
      } else {
        this.showError(data.msg);
      }
    });
  }

  uploadAll() {
    this.fileUploadService.uploadAll();
  }

  uploadFileItem(file: FileItem) {
    this.fileUploadService.uploadItem(file);
  }

  cancelFileItem(file: FileItem) {
    this.fileUploadService.cancelItem(file);
  }

  removeFile(file: FileItem) {
    let index = this.newSession.files.indexOf(file.file);
    this.fileUploadService.removeFromQueue(file);
    if(index !== -1)
      this.newSession.files.splice(index, 1);
    //remove file from server
    this.session.removeFile(file.file).subscribe(data => {
      if(data.success) {
        this.presentToast(data.msg);
      } else {
        this.showError(data.msg);
      }
    })
  }

  showLoading() {
    this.loading = this.loadingCtrl.create({
      content: 'Please wait...',
      dismissOnPageChange: true
    });
    this.loading.present();
  }

  presentToast(text: string) {
    let toast = this.toastCtrl.create({
      message: text,
      duration: 2000,
    });

    toast.present();
  }

  // uploadSheet() {
  //    let actionSheet = this.actionSheetCtrl.create({
  //      title: 'Select Image Source',
  //      buttons: [
  //        {
  //          text: 'Upload from Gallery',
  //          handler: () => {
  //           //  this.takePicture(this.camera.PictureSourceType.PHOTOLIBRARY);
  //          }
  //        },
  //        {
  //          text: 'Use Camera',
  //          handler: () => {
  //           //  this.takePicture(this.camera.PictureSourceType.PHOTOLIBRARY);
  //          }
  //        },
  //        {
  //          text: 'Upload Audio',
  //          handler: () => {
  //           //  this.takePicture(this.camera.PictureSourceType.CAMERA);
  //          }
  //        },
  //        {
  //          text: 'Cancel',
  //          role: 'cancel'
  //        }
  //      ]
  //    });
  //    actionSheet.present();
  //  }

   showError(text) {
     let alert = this.alertCtrl.create({
       title: 'Fail',
       subTitle: text,
       buttons: ['OK']
     });
     alert.present(prompt);
   }


   logout() {
     this.navCtrl.setRoot('login-page');
     this.auth.logout();
   }


}
