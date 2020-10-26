export interface IConfiguration {
  _id: string;
  name: string;
  value: IConfigurationValue[];
}

export interface IConfigurationValue {
  id: string;
  name: string;
  description: string;
  condition: {
    field: string;
    operator: string;
    value: string;
    type: string;
  };
  value: string;
  extra: IConfigurationExtra[];
  is_value_entity: boolean;
  value_entity: string;
  value_entity_extra: IConfigurationValueExtra[];
}

export interface IConfigurationExtra {
  name: string;
  value: string;
  type: string;
}

export interface IConfigurationValueExtra {
  id: string;
  name: string;
  value: string;
  is_value_entity: boolean;
}
