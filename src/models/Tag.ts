import Realm, { BSON, List } from "realm";
import { Credential } from "./Credential";

export class Tag extends Realm.Object<Tag> {
  _id!: BSON.ObjectId;
  name!: string;
  credentials!: List<Credential>;
  colorHex!: string;
  iconName!: string;

  static schema: Realm.ObjectSchema = {
    name: "Tag",
    primaryKey: "_id",
    properties: {
      _id: "objectId",
      name: "string",
      credentials: "Credential[]",
      colorHex: "string",
      iconName: "string",
    },
  };

  addCredential(realm: Realm, credential: Credential) {
    realm.write(() => {
      this.credentials.push(credential);
    });
  }

  removeCredential(realm: Realm, credential: Credential) {
    realm.write(() => {
      const index = this.credentials.indexOf(credential);
      if (index > -1) {
        this.credentials.splice(index, 1);
      }
    });
  }
}
