package courses.abc.atoms.core.util;

import java.io.InputStream;

import org.springframework.beans.factory.annotation.Autowired;
import org.yaml.snakeyaml.LoaderOptions;
import org.yaml.snakeyaml.Yaml;
import courses.abc.atoms.core.services.FeatureManagerService;
import org.yaml.snakeyaml.constructor.Constructor;

public class LMSFeature {
     @Autowired
 private FeatureManagerService featureManagerService;
 public LMSFeature(FeatureManagerService featureManagerService) {
     this.featureManagerService = featureManagerService;
     loadAndRegisterFeature();
 }
private void loadAndRegisterFeature() {
     InputStream utilityConfigFileInputStream =null;
     try{
             utilityConfigFileInputStream = this.getClass().getResourceAsStream("feature.yml");
             LoaderOptions loaderOptions = new LoaderOptions();
             Yaml yaml = new Yaml(new Constructor(FeatureBean.class, loaderOptions));
             FeatureBean features = yaml.load(utilityConfigFileInputStream);
             
             // register feature
             featureManagerService.registerFeature(features);
     }
     catch(Exception ioe){
         ioe.printStackTrace();
     }
     finally{
         if (utilityConfigFileInputStream!=null){
             try{
                 utilityConfigFileInputStream.close();
             }catch(Exception ioe){
                 ioe.printStackTrace();
             }
         }
             
     }
 }
}
