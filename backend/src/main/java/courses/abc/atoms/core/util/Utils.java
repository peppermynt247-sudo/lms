package courses.abc.atoms.core.util;

import java.io.StringWriter;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;

import javax.xml.XMLConstants;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerException;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.xml.sax.InputSource;

import com.google.gson.JsonObject;

public class Utils {

	public enum History {
        REMOVED,
        ADDED,
        CHANGED
	};
	
	//helper method for parsing
	public static Document parse(InputSource source) {
		try {
			DocumentBuilderFactory builder = DocumentBuilderFactory.newInstance();
			builder.setFeature("http://xml.org/sax/features/external-general-entities", false);
			builder.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
			builder.setNamespaceAware(true);
			return builder.newDocumentBuilder().parse(source);
		} catch(Exception e){
			e.printStackTrace();
		}
		
		return null;
	}

	public static class SourceInfo {
		public String sourceComponentContext;
		public String sourceConfiguration;
	}

	public static JsonObject getNotificationJsonObject(String message, String linkedTo, String type) {
		JsonObject notificationJsonObject = new JsonObject();
		notificationJsonObject.addProperty("message", message);
        notificationJsonObject.addProperty("linkedTo", linkedTo);
		notificationJsonObject.addProperty("type", type);
		
		return notificationJsonObject;
	}

}
