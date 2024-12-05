declare module 'kapsule' {
  type PropType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'func';

  interface PropDefinition {
    default?: any;
    defaultVal?: any;
    onChange?: (newVal: any, state: any) => void;
    triggerUpdate?: boolean;
    type?: PropType;
  }

  interface KapsuleConfig {
    props?: { [key: string]: PropDefinition };
    methods?: { [key: string]: (state: any, ...args: any[]) => any };
    stateInit?: () => any;
    init?: (instance: any, ...args: any[]) => void;
    update?: (state: any, ...args: any[]) => void;
  }

  function Kapsule(config: KapsuleConfig): (config?: any) => any;
  export default Kapsule;
}
