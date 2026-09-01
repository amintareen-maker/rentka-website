export type FleetFormVehicle={key:string;make:string;model:string;modelYear:string;registrationNumber:string;category:string;ownershipRelationship:string};
export type SlottedUpload={slotKey:string};
export const MAX_VENDOR_VEHICLES=12;
export const createFleetVehicle=(key:string):FleetFormVehicle=>({key,make:"",model:"",modelYear:"",registrationNumber:"",category:"Sedan",ownershipRelationship:""});
export function removeFleetVehicleState<T extends SlottedUpload>(vehicles:FleetFormVehicle[],uploads:T[],key:string){return{vehicles:vehicles.filter(vehicle=>vehicle.key!==key),uploads:uploads.filter(upload=>upload.slotKey!==key)}}
