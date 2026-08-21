package courses.abc.atoms.core.services;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import courses.abc.atoms.core.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import courses.abc.atoms.core.controller.NotificationsController;
import courses.abc.atoms.core.model.core.RoleType;
import courses.abc.atoms.core.model.lms.ApplicationConfiguration;
import courses.abc.atoms.core.model.lms.Feature;
import courses.abc.atoms.core.repositories.FeatureRepository;
import courses.abc.atoms.core.util.FeatureBean;
import courses.abc.atoms.core.util.RoleBean;
import courses.abc.atoms.core.util.Utils;
import javax0.license3j.parsers.NumericParser.Int;
import lombok.extern.slf4j.Slf4j;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

@EnableScheduling
@Service
@Slf4j
public class FeatureManagerService {

    @Autowired
    private ApplicationConfigurationService applicationConfigurationService;

    @Autowired
    private FeatureRepository featureRepository;

    @Autowired
    private NotificationsService notificationsService;

    private Map<String, FeatureBean> registeredFeatures = new HashMap<String, FeatureBean>(); 

    public boolean registerFeature(FeatureBean features) {
        registeredFeatures.put(features.getId(), features);

        // todo warn if feature version is older than it was

        // todo warn if feature version is not the latest

        // todo make sure featuremanager 

        //Create Or Update feature
        createOrUpdateFeature(features);

        // create roles if they don't exist
        // createFeatureRoles(features);

        log.debug("Feature registered: {}", features.getId());

        return true;
    }

    private void createOrUpdateFeature(FeatureBean featureBean) {
        log.debug("Create Or Update Feature - {}", featureBean.getName());
        Optional<Feature> feature = this.featureRepository.findById(featureBean.getId());
        if(feature.isPresent()) {
            log.debug(String.format("Feature '%s' exists, checking for update.", featureBean.getName()));
            Feature featureToUpdate = feature.get();
            boolean saveFeature = false;
            if(featureToUpdate.isEnableManagerRole() != featureBean.isEnableManagerRole()) {
                featureToUpdate.setEnableManagerRole(featureBean.isEnableManagerRole());
                saveFeature = true;
            }
            if(!featureToUpdate.getAdditionalInfo().equals(featureBean.getAdditionalInfo())) {
                featureToUpdate.setAdditionalInfo(featureBean.getAdditionalInfo());
                saveFeature = true;
            }
            if(!featureToUpdate.getDescription().equals(featureBean.getDescription())) {
                featureToUpdate.setDescription(featureBean.getDescription());
                saveFeature = true;
            }
            if(!featureToUpdate.getName().equals(featureBean.getName())) {
                featureToUpdate.setName(featureBean.getName());
                saveFeature = true;
            }
            if(!featureToUpdate.getScope().equals(featureBean.getScope())) {
                featureToUpdate.setScope(featureBean.getScope());
                saveFeature = true;
            }
            if(!featureToUpdate.getSupportedVersions().equals(featureBean.getSupportedVersions())) {
                featureToUpdate.setSupportedVersions(featureBean.getSupportedVersions());
                saveFeature = true;
            }
            if(featureBean.getVersion().compareTo(featureToUpdate.getInstalledVersion()) > 0) {
                featureToUpdate.setInstalledVersion(featureBean.getVersion());
                featureToUpdate.setAvailableVersion(featureBean.getVersion());
                saveFeature = true;
            }
            
            if(saveFeature) {
                //Save Feature
                this.featureRepository.save(featureToUpdate);
                log.debug(String.format("Updated feature '%s'.", featureBean.getName()));
            } else {
                log.debug(String.format("Nothing new to update feature '%s'.", featureBean.getName()));
            }
        } else {
            log.debug(String.format("Feature '%s' doesn't exists, creating...", featureBean.getName()));
            Feature newFeature = new Feature();
            newFeature.setId(featureBean.getId());
            newFeature.setAdditionalInfo(featureBean.getAdditionalInfo());
            newFeature.setAvailableVersion(featureBean.getVersion());
            newFeature.setDescription(featureBean.getDescription());
            newFeature.setEnableManagerRole(featureBean.isEnableManagerRole());
            newFeature.setInstalledVersion(featureBean.getVersion());
            newFeature.setName(featureBean.getName());
            newFeature.setScope(featureBean.getScope());
            newFeature.setSupportedVersions(featureBean.getSupportedVersions());

            this.featureRepository.save(newFeature);
            log.debug(String.format("Created new feature '%s'.", featureBean.getName()));
        }
    }

    public boolean isFeatureRegistered(String featureId) {
        return registeredFeatures.containsKey(featureId);
    }

    public FeatureBean getFeature(String featureId) {
        return registeredFeatures.get(featureId);
    }

    public Map<String, FeatureBean> getAllRegisteredFeatures() {
        return registeredFeatures;
    }

    /*
        This method will be called after Component loaded by InitialApplicationSetup.java 
        It is used to load the Features from embedded JSON file.
    */
    public void init() {
        loadFeaturesFromLocalFile();
    }

    /*
    * Check for new updates/features everyday at 2am
    */
    @Scheduled(cron = "0 0 2 * * *")    //New update will be checked everyday at 2AM
    public void checkUpdateScheduler() {
        log.debug("Scheduler Task Invoked");
        this.checkUpdatedFeatures();
    }

    /*
      This method check feature updates from public JSON file and then validate them
    */
    public String checkUpdatedFeatures() {
         // TODO: Enable this code after json available on public network.
        /*ResponseEntity<?> featureDetails = this.getFeatureDetailsFromLocalFile();
        if (featureDetails.getStatusCode() == HttpStatus.OK) {
            this.validateFeatureDetails(featureDetails.getBody().toString());
            return ResponseEntity.ok().build();
        } else {
            return ResponseEntity.status(featureDetails.getStatusCode()).build();
        }
        */

        String features = this.getFeaturesFromLocalFile("/FeatureDetails.json");
        if (features != null) {
            this.validateFeatures(features);
            return features;
        } else {
            return null;
        }
    }
    
    public List<Feature> getFeatureObjects() {
       return this.featureRepository.findAll();
    }

    /*
        This method provide available feature updates.
    */
    public JsonArray getFeaturesAvailableUpdates() {
        JsonArray featuresAvailableUpdateJsonArray = new JsonArray();
        List<Feature> featuresList = this.featureRepository.findAll();
        for (int index = 0; index < featuresList.size(); index++) {
            Feature feature = (Feature) featuresList.get(index);
            if(feature.getInstalledVersion() == null || feature.getAvailableVersion() != null && !feature.getInstalledVersion().equals(feature.getAvailableVersion())) {
                log.debug("Adding Available Feature - '{}'", feature.getName());
                JsonObject jsonObject = new JsonObject();
                jsonObject.addProperty("id", feature.getId());
                jsonObject.addProperty("scope", feature.getScope());
                jsonObject.addProperty("name", feature.getName());
                jsonObject.addProperty("description", feature.getDescription());
                jsonObject.addProperty("installedVersion", feature.getInstalledVersion());
                jsonObject.addProperty("availableVersion", feature.getAvailableVersion());
                jsonObject.addProperty("additionalInfo", feature.getAdditionalInfo());
                jsonObject.addProperty("supportedVersions", feature.getSupportedVersions());
                featuresAvailableUpdateJsonArray.add(jsonObject);
            }
        }

        return featuresAvailableUpdateJsonArray;
    }

    /*
        This method is used to load features from embedded JSON file.
    */
    private void loadFeaturesFromLocalFile() {
        log.debug("Loading Features from embedded JSON file.");
        String features = this.getFeaturesFromLocalFile("/FeatureDetails.json");
        if (features != null) {
            JsonObject featuresJson = JsonParser.parseString(features).getAsJsonObject();
            if (featuresJson != null) {
                JsonArray featuresJsonArray = (JsonArray) featuresJson.get("featureList");
                if (featuresJsonArray.size() > 0) {
                    for (int index = 0; index < featuresJsonArray.size(); index++) {
                        JsonObject featuresJsonObject = (JsonObject) featuresJsonArray.get(index);
                        if (featuresJsonObject != null) {
                            Optional<Feature> existingFeatureDetails = this.featureRepository.findById(featuresJsonObject.get("id").getAsString());
                            if (existingFeatureDetails.isPresent()) {
                                if(existingFeatureDetails.get().getInstalledVersion() != null && compareVersion(existingFeatureDetails.get().getInstalledVersion(), featuresJsonObject.get("version").getAsString()) > 0) {
                                    saveFeature(existingFeatureDetails.get(), featuresJsonObject);
                                }
                            } else {
                                Feature newFeatureDetails = new Feature();
                                saveFeature(newFeatureDetails, featuresJsonObject);
                            }
                        }
                    }
                }

                String lmsVersion = featuresJson.get("applicationVersion").getAsString();
                Optional<ApplicationConfiguration> applicationConfigurationRep = applicationConfigurationService.getApplicationConfiguration();
                if (applicationConfigurationRep.isPresent()) {
                    ApplicationConfiguration applicationConfiguration = applicationConfigurationRep.get();
                    if (applicationConfiguration.getInstalledVersion() == null || 
                        !applicationConfiguration.getInstalledVersion().equals(lmsVersion)) {
                        applicationConfiguration.setInstalledVersion(lmsVersion);
                        if (applicationConfiguration.getAvailableVersion() == null ||
                            compareVersion(applicationConfiguration.getAvailableVersion(), lmsVersion) > 0) {
                                
                            applicationConfiguration.setAvailableVersion(lmsVersion);
                        }
                        
                        applicationConfigurationService.updateApplicationConfiguration(applicationConfiguration);
                    }
                } else {
                    throw new ResourceNotFoundException("Application configuration not found. Please contact support.");
                }
            }
        } else {
            log.debug("Features not found in embedded JSON file.");
        }
    }

    /*
        This method compare two versions, it return 1 if new version is greater otherwise return 0
    */
    private int compareVersion(String oldVersion, String newVersion) {
        if(!oldVersion.isEmpty() && ! newVersion.isEmpty()) {
            String[] oldVersionArray = oldVersion.split("\\.");
            String[] newVersionArray = newVersion.split("\\.");
            int index;
            //Version strings may be in different sizes, like 1.0, 1.0.1 etc. 
            if(newVersionArray.length >= oldVersionArray.length ) {
                //Check the lower length version first.
                for (index = 0; index < oldVersionArray.length; index++) {
                    if(Int.parse(newVersionArray[index]) > Int.parse(oldVersionArray[index])) {
                        return 1;
                    }
                }
                //Now check if greater length version string is really greater or just 0 are added.
                for (; index < newVersionArray.length; index++) {
                    if(Int.parse(newVersionArray[index]) > 0) {
                        return 1;
                    }
                }
            } else {
                //New Version string is small but it may be greater e.g. 2.0 is greater than 1.0.1
                for (index = 0; index < newVersionArray.length; index++) {
                    if(Int.parse(newVersionArray[index]) > Int.parse(oldVersionArray[index])) {
                        return 1;
                    }
                }
            }
        }

        return 0;
    }

    /*
        This method save the feature and initially set same version to Installed and Available version. 
    */
    private void saveFeature(Feature feature, JsonObject featureJsonObject) {
        feature.setId(featureJsonObject.get("id").getAsString());
        feature.setScope(featureJsonObject.get("scope").getAsString());
        feature.setName(featureJsonObject.get("name").getAsString());
        feature.setDescription(featureJsonObject.get("description").getAsString());
        feature.setAdditionalInfo(featureJsonObject.get("additionalInfo").getAsString());
        feature.setInstalledVersion(featureJsonObject.get("version").getAsString());
        feature.setAvailableVersion(featureJsonObject.get("version").getAsString());
        feature.setSupportedVersions(featureJsonObject.get("supportedVersions").getAsString());
                    
        this.featureRepository.save(feature);
    }

    /*
        This method saves the feature 
    */
    public void saveFeature(Feature feature) {
        this.featureRepository.save(feature);
    }

    /*
        This method save the available feature. These feature are available but not part of Installed LMS.
        It will not set the Installed version.
        Such features will only be listed in Update section and will not be listed on License page.
    */
    private void saveAvailableFeature(Feature feature, JsonObject featureJsonObject) {
        feature.setId(featureJsonObject.get("id").getAsString());
        feature.setScope(featureJsonObject.get("scope").getAsString());
        feature.setName(featureJsonObject.get("name").getAsString());
        feature.setDescription(featureJsonObject.get("description").getAsString());
        feature.setAdditionalInfo(featureJsonObject.get("additionalInfo").getAsString());
        feature.setAvailableVersion(featureJsonObject.get("version").getAsString());
        feature.setSupportedVersions(featureJsonObject.get("supportedVersions").getAsString());
                    
        this.featureRepository.save(feature);
    }

    /*
        This method will load feature from embedded JSON file.
    */
    private String getFeaturesFromLocalFile(String fileName) {
        JsonObject featuresJson = null;
        log.debug("Reading embedded JSON file.");
        try {
            InputStream inputStream = getClass().getResourceAsStream(fileName);
            BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream));
            StringBuilder builder = new StringBuilder();
            String line = null;
            while ((line = reader.readLine()) != null) {
                builder.append(line);
            }
            reader.close();
            featuresJson = JsonParser.parseString(builder.toString()).getAsJsonObject();
        } catch (IOException e) {
            log.error("Error while reading feature from embedded file.", e);
        }

        if (featuresJson != null) {
            return featuresJson.toString();
        } else {
            log.debug("Feature JSON is null.");
        }
        
        return null;
    }

    /*
        This method validates JSON against the installed features.
        It will add any new available feature in repository and mark it as just available feature by not setting Installed version.
        Such features will be listed in update section only.
        We are also sending Notification here for new available features. Update message is read from the provided JSON.
        This method is also called by scheduler task once every day and we just want to send Notification only once for each new version of LMS.
        To handle it, available version of LMS is updated so next check will not send Notification for same version again and again.
    */
    // to do 
    // to do need to send new feature notifications when new indiidual feature is added
    // to do need to send version update when there is a version update
    // to do eventually features may be separate from packaged LMS.war
    private void validateFeatures(String body) {
        JsonObject bodyJson = JsonParser.parseString(body).getAsJsonObject();
        if (bodyJson != null) {
            String applicationVersion = bodyJson.get("applicationVersion").getAsString();
            Optional<ApplicationConfiguration> applicationConfigurationRep = applicationConfigurationService.getApplicationConfiguration();
            if (applicationConfigurationRep.isPresent()) {
                ApplicationConfiguration applicationConfiguration = applicationConfigurationRep.get();
                if (applicationConfiguration.getAvailableVersion() == null || 
                    compareVersion(applicationConfiguration.getAvailableVersion(), applicationVersion) > 0) {
                    JsonArray featuresJsonArray = (JsonArray) bodyJson.get("featureList");
                    if (featuresJsonArray.size() > 0) {
                        boolean newVersionAvailable = false;
                        for (int index = 0; index < featuresJsonArray.size(); index++) {
                            JsonObject featuresJsonObject = (JsonObject) featuresJsonArray.get(index);
                            if (featuresJsonObject != null) {
                                Optional<Feature> existingFeatures = this.featureRepository.findById(featuresJsonObject.get("id").getAsString());
                                if (existingFeatures.isPresent()) {
                                    Feature existingFeaturesInstance = existingFeatures.get();
                                    if (compareVersion(existingFeaturesInstance.getAvailableVersion(), featuresJsonObject.get("version").getAsString()) > 0) {
                                        if (featuresJsonObject.get("version").getAsString() != null && !featuresJsonObject.get("version").getAsString().isEmpty()) {
                                            log.debug("Feature '{}' exists, updating available version.", existingFeaturesInstance.getName());
                                            existingFeaturesInstance.setAvailableVersion(featuresJsonObject.get("version").getAsString());
                                            this.featureRepository.save(existingFeaturesInstance);
                                            newVersionAvailable = true;
                                        }
                                    }
                                } else {
                                    log.debug("New Feature '{}', adding as available feature.", featuresJsonObject.get("name").getAsString());
                                    Feature newFeatureDetails = new Feature();
                                    saveAvailableFeature(newFeatureDetails, featuresJsonObject);
                                    newVersionAvailable = true;
                                }
                            }
                        }
                        if (newVersionAvailable) {
                            //Send Notification for new available features, read message from provided JSON
                            NotificationsController notificationsController = new NotificationsController(this.notificationsService);
                            JsonObject notificationJsonObject = Utils.getNotificationJsonObject(
                                bodyJson.get("updateDescription").getAsString(), "/admin/settings/licenses", "user");
                            notificationsController.addNotificationForAllUser(notificationJsonObject.toString());
                            log.debug("Sending new features available notification to all users.");
                        }
                    }
                    //Update the new available version to control user notification for next check
                    applicationConfiguration.setAvailableVersion(applicationVersion);
                    applicationConfigurationService.updateApplicationConfiguration(applicationConfiguration);
                }
            }
        }
    }
}