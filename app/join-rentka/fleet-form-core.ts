export type FleetFormVehicle={key:string;make:string;model:string;modelYear:string;registrationNumber:string;category:string;ownershipRelationship:string};
export type FleetFormDriver={key:string;name:string;mobile:string;whatsapp:string;zoneIds:string[];cnicNumber:string;licenceNumber:string;licenceIssueDate:string;licenceExpiryDate:string};
export type SlottedUpload={slotKey:string};
export const MAX_VENDOR_VEHICLES=12;
export const MAX_VENDOR_DRIVERS=20;
export const createFleetVehicle=(key:string):FleetFormVehicle=>({key,make:"",model:"",modelYear:"",registrationNumber:"",category:"Sedan",ownershipRelationship:""});
export const createFleetDriver=(key:string):FleetFormDriver=>({key,name:"",mobile:"",whatsapp:"",zoneIds:[],cnicNumber:"",licenceNumber:"",licenceIssueDate:"",licenceExpiryDate:""});
export function removeFleetVehicleState<T extends SlottedUpload>(vehicles:FleetFormVehicle[],uploads:T[],key:string){return{vehicles:vehicles.filter(vehicle=>vehicle.key!==key),uploads:uploads.filter(upload=>upload.slotKey!==key)}}
export function removeFleetDriverState<T extends SlottedUpload>(drivers:FleetFormDriver[],uploads:T[],key:string){return{drivers:drivers.filter(driver=>driver.key!==key),uploads:uploads.filter(upload=>upload.slotKey!==key)}}
